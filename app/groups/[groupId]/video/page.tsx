'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type PeerConn = {
	pc: RTCPeerConnection;
	stream: MediaStream;
};

export default function VideoPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [peers, setPeers] = useState<Record<string, MediaStream>>({});
	const [camOn, setCamOn] = useState(true);
	const [micOn, setMicOn] = useState(true);
	const conns = useRef<Map<string, PeerConn>>(new Map());
	const unsubSignals = useRef<() => void>();
	const unsubPeers = useRef<() => void>();
	const screenTrackRef = useRef<MediaStreamTrack | null>(null);

	useEffect(() => {
		if (!user) return;
		let isMounted = true;
		(async () => {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			if (!isMounted) return;
			setLocalStream(stream);
			await setDoc(doc(db, 'groups', groupId, 'peers', user.uid), {
				online: true,
				updatedAt: serverTimestamp()
			}, { merge: true });

			// Listen for signals addressed to me
			unsubSignals.current = onSnapshot(collection(db, 'groups', groupId, 'signals'), async (snap) => {
				for (const d of snap.docChanges()) {
					if (d.type !== 'added') continue;
					const data = d.doc.data() as any;
					if (data.to !== user.uid) continue;
					const from = data.from as string;
					await handleSignal(from, data, stream);
				}
			});

			// Detect peers and initiate connections on a stable ordering (uid compare)
			unsubPeers.current = onSnapshot(collection(db, 'groups', groupId, 'peers'), async (snap) => {
				for (const docChange of snap.docChanges()) {
					const peerId = docChange.doc.id;
					if (peerId === user.uid) continue;
					if (docChange.type === 'added') {
						// Initiator: the lexicographically smaller uid starts
						if (user.uid < peerId) {
							await startConnection(peerId, stream);
						}
					}
				}
			});
		})();
		return () => {
			isMounted = false;
			unsubSignals.current?.();
			unsubPeers.current?.();
			localStream?.getTracks().forEach((t) => t.stop());
			conns.current.forEach(({ pc }) => pc.close());
			conns.current.clear();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [db, groupId, user?.uid]);

	async function handleSignal(from: string, data: any, stream: MediaStream) {
		let conn = conns.current.get(from);
		if (!conn) {
			conn = await createConnection(from, stream);
		}
		if (data.type === 'offer' && data.sdp) {
			await conn.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
			const answer = await conn.pc.createAnswer();
			await conn.pc.setLocalDescription(answer);
			await addDoc(collection(db, 'groups', groupId, 'signals'), {
				from: user!.uid,
				to: from,
				type: 'answer',
				sdp: answer.sdp,
				createdAt: serverTimestamp()
			});
		} else if (data.type === 'answer' && data.sdp) {
			await conn.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
		} else if (data.type === 'ice' && data.candidate) {
			try {
				await conn.pc.addIceCandidate(data.candidate);
			} catch {
				// ignore
			}
		}
	}

	async function startConnection(peerId: string, stream: MediaStream) {
		const conn = await createConnection(peerId, stream);
		const offer = await conn.pc.createOffer();
		await conn.pc.setLocalDescription(offer);
		await addDoc(collection(db, 'groups', groupId, 'signals'), {
			from: user!.uid,
			to: peerId,
			type: 'offer',
			sdp: offer.sdp,
			createdAt: serverTimestamp()
		});
	}

	async function createConnection(peerId: string, stream: MediaStream): Promise<PeerConn> {
		let existing = conns.current.get(peerId);
		if (existing) return existing;
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
		});
		// ICE
		pc.onicecandidate = async (e) => {
			if (e.candidate) {
				await addDoc(collection(db, 'groups', groupId, 'signals'), {
					from: user!.uid,
					to: peerId,
					type: 'ice',
					candidate: e.candidate.toJSON(),
					createdAt: serverTimestamp()
				});
			}
		};
		// Remote stream
		const remoteStream = new MediaStream();
		pc.ontrack = (e) => {
			e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
			setPeers((prev) => ({ ...prev, [peerId]: remoteStream }));
		};
		// Local tracks
		stream.getTracks().forEach((t) => pc.addTrack(t, stream));

		conns.current.set(peerId, { pc, stream: remoteStream });
		return { pc, stream: remoteStream };
	}

	function toggleCamera() {
		if (!localStream) return;
		localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
		setCamOn((v) => !v);
	}
	function toggleMic() {
		if (!localStream) return;
		localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
		setMicOn((v) => !v);
	}
	async function startScreenShare() {
		if (!user) return;
		try {
			// @ts-expect-error - getDisplayMedia types vary by browser
			const display: MediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
			const track: MediaStreamTrack | undefined = display.getVideoTracks()[0];
			if (!track) return;
			screenTrackRef.current = track;
			conns.current.forEach(({ pc }) => {
				const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
				if (sender) sender.replaceTrack(track);
			});
			track.onended = () => stopScreenShare();
		} catch {
			// ignore
		}
	}
	function stopScreenShare() {
		if (!localStream) return;
		const camTrack = localStream.getVideoTracks()[0];
		conns.current.forEach(({ pc }) => {
			const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
			if (sender && camTrack) sender.replaceTrack(camTrack);
		});
		screenTrackRef.current?.stop();
		screenTrackRef.current = null;
	}

	return (
		<RequireAuth>
		<div className="space-y-4">
			<Card className="p-3 flex items-center gap-2">
				<Button variant="outline" onClick={toggleCamera}>{camOn ? 'Camera off' : 'Camera on'}</Button>
				<Button variant="outline" onClick={toggleMic}>{micOn ? 'Mute' : 'Unmute'}</Button>
				<Button variant="outline" onClick={screenTrackRef.current ? stopScreenShare : startScreenShare}>
					{screenTrackRef.current ? 'Stop sharing' : 'Share screen'}
				</Button>
				<div className="text-xs text-muted ml-auto">Up to ~10 users in a mesh</div>
			</Card>
			<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Card className="p-3">
					<div className="text-sm text-muted mb-2">You</div>
					<video
						autoPlay
						muted
						playsInline
						className="w-full rounded-lg bg-black/40 aspect-video"
						ref={(el) => {
							if (el && localStream) el.srcObject = localStream;
						}}
					/>
				</Card>
				{Object.entries(peers).map(([peerId, stream]) => (
					<Card key={peerId} className="p-3">
						<div className="text-sm text-muted mb-2 truncate">{peerId}</div>
						<video
							autoPlay
							playsInline
							className="w-full rounded-lg bg-black/40 aspect-video"
							ref={(el) => {
								if (el) el.srcObject = stream;
							}}
						/>
					</Card>
				))}
			</div>
		</div>
		</RequireAuth>
	);
}

