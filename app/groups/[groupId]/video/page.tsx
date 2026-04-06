'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Video, VideoOff, Mic, MicOff, MonitorUp, X } from 'lucide-react';

type PeerConn = {
	pc: RTCPeerConnection;
	stream: MediaStream;
};

const StreamVideo = ({ stream, name, isLocal, camOn, cameraError }: { stream: MediaStream | null, name: string, isLocal?: boolean, camOn?: boolean, cameraError?: string }) => {
	const [isSpeaking, setIsSpeaking] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (!stream) return;
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
		}

		// Web Audio API to detect frequency volume
		let audioCtx: AudioContext;
		let animId: number;

		try {
			audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
			const analyser = audioCtx.createAnalyser();
			analyser.fftSize = 256;

			const audioTracks = stream.getAudioTracks();
			if (audioTracks.length > 0) {
				const audioStream = new MediaStream([audioTracks[0]]);
				const source = audioCtx.createMediaStreamSource(audioStream);
				source.connect(analyser);

				const dataArray = new Uint8Array(analyser.frequencyBinCount);

				const tick = () => {
					analyser.getByteFrequencyData(dataArray);
					let sum = 0;
					for (let i = 0; i < dataArray.length; i++) {
						sum += dataArray[i];
					}
					const avg = sum / dataArray.length;
					
					// Speaking threshold (sensitive)
					setIsSpeaking(avg > 15);

					animId = requestAnimationFrame(tick);
				};
				tick();
			}
		} catch (e) {
			console.error("Audio analyser error:", e);
		}

		return () => {
			if (animId) cancelAnimationFrame(animId);
			if (audioCtx && audioCtx.state !== 'closed') {
				audioCtx.close().catch(() => {});
			}
		};
	}, [stream]);

	const showAsOff = isLocal && !camOn;

	return (
		<div className={`relative rounded-[4rem] min-h-[350px] flex flex-col justify-center overflow-hidden transition-all duration-700 ${isSpeaking ? 'ring-8 ring-neonLime shadow-max scale-[1.02] z-20' : 'border border-black/5 shadow-soft z-10'} ${isLocal ? "bg-softBlush" : "bg-white"}`}>
			{/* Typographic Label Sticker */}
			<div className={`absolute top-8 left-8 z-30 px-6 py-2 text-[10px] font-black font-poppins uppercase tracking-[0.3em] ${isSpeaking ? 'bg-neonLime text-deepInk' : isLocal ? 'bg-deepInk text-white' : 'bg-white text-deepInk border border-black/5'} shadow-soft`}>
				{name} {isSpeaking && "/ SPEAKING"}
			</div>

			{isLocal && cameraError && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500 z-40 p-8 text-center text-white">
					<X className="w-12 h-12 mb-4" />
					<h3 className="text-2xl font-black uppercase tracking-tighter">Hardware Lock</h3>
					<p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-2">{cameraError}</p>
				</div>
			)}

			{showAsOff && !cameraError && (
				<div className="absolute inset-0 flex flex-col items-center justify-center text-deepInk font-poppins font-black uppercase tracking-tighter opacity-[0.03] text-[15vw] select-none">
					OFF
				</div>
			)}

			{!cameraError && (
				<video
					ref={videoRef}
					autoPlay
					muted={isLocal}
					playsInline
					className={`w-full h-full object-cover transition-all duration-1000 ${showAsOff ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}
				/>
			)}
		</div>
	);
};

export default function VideoPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [peers, setPeers] = useState<Record<string, MediaStream>>({});
	
	const [camOn, setCamOn] = useState(true);
	const [micOn, setMicOn] = useState(true);
	const [isScreenSharing, setIsScreenSharing] = useState(false);
	const [cameraError, setCameraError] = useState<string>('');
	
	const streamRef = useRef<MediaStream | null>(null);
	const conns = useRef<Map<string, PeerConn>>(new Map());
	const unsubSignals = useRef<() => void>();
	const unsubPeers = useRef<() => void>();
	const screenTrackRef = useRef<MediaStreamTrack | null>(null);

	useEffect(() => {
		if (!user) return;
		let isMounted = true;
		(async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
				
				// CRITICAL FIX: React 18 Strict Mode mounts twice in development.
				// If this unmounted while getUserMedia was loading, the hardware stream was orphaned and permanently left on!
				if (!isMounted) {
					stream.getTracks().forEach(t => t.stop());
					return;
				}
				
				streamRef.current = stream;
				setLocalStream(stream);
				setCameraError('');
				
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
							if (user.uid < peerId) {
								await startConnection(peerId, stream);
							}
						}
					}
				});
			} catch (e: any) {
				console.error("Camera access error:", e);
				if (isMounted) setCameraError(e.message || "Hardware or Permission Denied");
			}
		})();
		return () => {
			isMounted = false;
			unsubSignals.current?.();
			unsubPeers.current?.();
			streamRef.current?.getTracks().forEach((t) => t.stop());
			screenTrackRef.current?.stop();
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
		
		const remoteStream = new MediaStream();
		pc.ontrack = (e) => {
			e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
			setPeers((prev) => ({ ...prev, [peerId]: remoteStream }));
		};
		
		stream.getTracks().forEach((t) => pc.addTrack(t, stream));

		conns.current.set(peerId, { pc, stream: remoteStream });
		return { pc, stream: remoteStream };
	}

	async function toggleCamera() {
		if (!localStream) return;
		
		if (camOn) {
			// HARDWARE WIPE: Fully destroy the native browser video tracks to kill the webcam completely
			localStream.getVideoTracks().forEach((t) => {
				t.stop();
				localStream.removeTrack(t);
			});
			
			// Disconnect the outbound pipeline so the browser entirely unbinds from hardware
			conns.current.forEach(({ pc }) => {
				const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
				if (videoSender && !isScreenSharing) {
					videoSender.replaceTrack(null);
				}
			});
			
			setCamOn(false);
		} else {
			try {
				// Re-boot hardware from scratch natively
				const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
				const newTrack = newStream.getVideoTracks()[0];
				
				if (newTrack) {
					localStream.addTrack(newTrack);
					
					// Rehydrate the actual WebRTC TCP streams if we are NOT currently screen sharing
					conns.current.forEach(({ pc }) => {
						// Look for the sender that currently has NO track (since we replaced it with null) or the stopped track
						// Luckily, `getSenders()` returns a list matching the original tracks. If it's null, we might not know it was 'video'.
						// Typically, we only have 1 audio and 1 video sender. We'll identify it directly:
						const senders = pc.getSenders();
						// The audio sender exists. The other sender is the video one.
						const videoSender = senders.find(s => s.track?.kind === 'video') || senders.find(s => !s.track);
						
						if (videoSender && !isScreenSharing) {
							videoSender.replaceTrack(newTrack);
						}
					});
					setCamOn(true);
					setCameraError(''); // Clear any lingering errors since it booted successfully
				}
			} catch (e: any) {
				console.error("Camera hardware re-initialization failed:", e);
				setCameraError(e.message || "Failed to boot camera hardware");
			}
		}
	}
	
	function toggleMic() {
		if (localStream) {
			localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
		}
		setMicOn((v) => !v);
	}
	
	async function startScreenShare() {
		if (!user) return;
		try {
			const display: MediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
			const track: MediaStreamTrack | undefined = display.getVideoTracks()[0];
			if (!track) return;
			
			screenTrackRef.current = track;
			
			// Replace all peer outgoing video tracks natively with the desktop stream
			conns.current.forEach(({ pc }) => {
				const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
				if (sender) sender.replaceTrack(track);
			});
			
			setIsScreenSharing(true);
			
			track.onended = () => stopScreenShare();
		} catch {
			// user cancelled the prompt
		}
	}
	
	function stopScreenShare() {
		if (!localStream) {
			setIsScreenSharing(false);
			return;
		}
		const camTrack = localStream.getVideoTracks()[0];
		
		// Swap the outgoing sender tracks back to the local webcam stream
		conns.current.forEach(({ pc }) => {
			const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
			if (sender && camTrack) sender.replaceTrack(camTrack);
		});
		
		screenTrackRef.current?.stop();
		screenTrackRef.current = null;
		setIsScreenSharing(false);
	}

	return (
		<RequireAuth>
			<div className="flex-1 bg-white relative overflow-hidden flex flex-col p-12">
				{/* Maximalist Texture Layer */}
				<div className="absolute top-0 right-0 text-[30vw] font-black uppercase text-black/[0.02] select-none pointer-events-none -translate-y-1/4 translate-x-1/4 leading-none">
					LIVE
				</div>

				<div className="flex-1 flex flex-col max-w-[1800px] mx-auto w-full relative z-10">
					<div className="flex items-center justify-between mb-16 px-4">
						<div className="flex items-center gap-6">
							<div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
							<h1 className="text-5xl font-black uppercase tracking-tighter text-deepInk">
								Video <span className="text-neonLime">Room</span>
							</h1>
						</div>
						<div className="text-[10px] font-black uppercase tracking-[0.5em] text-deepInk/20">
							/ {Object.keys(peers).length + 1} Members Active
						</div>
					</div>

					{/* WebRTC Video Grid Mesh */}
					<div className="flex-1 custom-scrollbar w-full">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-12 auto-rows-fr">
							
							{/* Local Camera Canvas Container */}
							<StreamVideo 
								stream={localStream} 
								name="YOU" 
								isLocal={true} 
								camOn={camOn} 
								cameraError={cameraError} 
							/>

							{/* Dynamic Incoming Peer Tracks */}
							{Object.entries(peers).map(([peerId, stream]) => (
								<StreamVideo 
									key={peerId} 
									stream={stream} 
									name={`${peerId.slice(0, 8)}...`} 
								/>
							))}
						</div>
					</div>
				</div>

				{/* Floating Minimal-Max Control Deck */}
				<div className="fixed bottom-12 left-0 right-0 flex justify-center z-50 pointer-events-none px-6">
					<div className="bg-white/80 backdrop-blur-3xl border border-white/20 shadow-max rounded-full px-10 py-5 flex items-center gap-8 pointer-events-auto">
						
						{/* Camera Toggle */}
						<button 
							onClick={toggleCamera} 
							className={`w-16 h-16 flex items-center justify-center rounded-full font-bold transition-all duration-300 ${
								camOn 
									? 'bg-deepInk text-white hover:scale-110 active:scale-95' 
									: 'bg-red-500 text-white shadow-max scale-110 hover:bg-red-600'
							}`}
							title={camOn ? 'Turn off camera' : 'Turn on camera'}
						>
							{camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
						</button>
						
						{/* Mic Toggle */}
						<button 
							onClick={toggleMic} 
							className={`w-16 h-16 flex items-center justify-center rounded-full font-bold transition-all duration-300 ${
								micOn 
									? 'bg-deepInk text-white hover:scale-110 active:scale-95' 
									: 'bg-red-500 text-white shadow-max scale-110 hover:bg-red-600'
							}`}
							title={micOn ? 'Mute microphone' : 'Unmute microphone'}
						>
							{micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
						</button>
						
						<div className="w-[1px] h-10 bg-black/10 mx-2"></div>
						
						{/* Screen Share Toggle */}
						<button 
							onClick={isScreenSharing ? stopScreenShare : startScreenShare} 
							className={`h-16 px-10 flex items-center gap-3 rounded-full font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 shadow-soft ${
								!isScreenSharing 
									? 'bg-neonLime text-deepInk hover:scale-105 active:scale-95' 
									: 'bg-red-500 text-white shadow-max scale-105'
							}`}
							title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
						>
							{!isScreenSharing ? (
								<>
									<MonitorUp className="w-5 h-5" /> 
									<span>Share</span>
								</>
							) : (
								<>
									<X className="w-5 h-5" /> 
									<span>Stop</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}
