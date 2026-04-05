'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';

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
	const conns = useRef<Map<string, PeerConn>>(new Map());
	const unsubSignals = useRef<() => void>();
	const unsubPeers = useRef<() => void>();

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

	return (
		<RequireAuth>
		<div className="space-y-4">
			<div className="grid md:grid-cols-3 gap-4">
				<div className="card p-3">
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
				</div>
				{Object.entries(peers).map(([peerId, stream]) => (
					<div key={peerId} className="card p-3">
						<div className="text-sm text-muted mb-2 truncate">{peerId}</div>
						<video
							autoPlay
							playsInline
							className="w-full rounded-lg bg-black/40 aspect-video"
							ref={(el) => {
								if (el) el.srcObject = stream;
							}}
						/>
					</div>
				))}
			</div>
			<p className="text-xs text-muted">Tip: Allow camera/microphone when prompted. Up to ~10 users in a mesh.</p>
		</div>
		</RequireAuth>
	);
}

