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
		<div className={`relative card rounded-lg min-h-[300px] flex flex-col justify-center overflow-hidden transition-all duration-150 ${isSpeaking ? 'border-[4px] border-purple-500 shadow-[6px_6px_0_#a855f7] -translate-y-1' : 'border-[3px] border-borderMain shadow-brutal'} ${isLocal ? "bg-accentYellow bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "bg-white bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-95 backdrop-blend-luminosity"}`}>
			<div className={`absolute top-3 left-3 z-10 box-border px-3 py-1 text-xs font-bold font-poppins uppercase tracking-wider ${isSpeaking ? 'bg-purple-500 text-white shadow-none border-2 border-transparent' : isLocal ? 'bg-black text-white shadow-sm border-2 border-transparent' : 'bg-accentBlue border-[2px] border-borderMain text-black shadow-brutal'} truncate max-w-[80%]`}>
				{name}
			</div>

			{isLocal && cameraError && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-red-100 z-20 border-[3px] border-red-500 m-2 rounded-lg shadow-brutal p-4 text-center">
					<X className="w-10 h-10 text-red-500 mb-2" />
					<p className="font-black uppercase tracking-wider text-red-600">Hardware Error</p>
					<p className="text-xs font-bold text-red-500 mt-1 max-w-[200px]">{cameraError}</p>
				</div>
			)}

			{showAsOff && !cameraError && (
				<div className="absolute inset-0 flex flex-col items-center justify-center text-black font-poppins font-black uppercase tracking-widest opacity-30 text-xl text-center">
					<VideoOff className="w-12 h-12 mb-4" />
					Camera Off
				</div>
			)}

			{!cameraError && (
				<video
					ref={videoRef}
					autoPlay
					muted={isLocal}
					playsInline
					className={`w-full h-full object-cover transition-opacity duration-300 ${showAsOff ? 'opacity-0' : 'opacity-100'}`}
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
			<div className="flex flex-col h-full w-full relative card bg-bg pb-24">
				{/* WebRTC Video Grid Mesh */}
				<div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar h-full w-full">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						
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

				{/* Floating Neo-Brutalist Control Deck */}
				<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-between gap-4 bg-white border-[3px] border-borderMain px-6 py-4 shadow-brutal z-20">
                    
					{/* Camera Toggle */}
					<button 
                        onClick={toggleCamera} 
                        className={`w-14 h-14 flex items-center justify-center border-[3px] border-borderMain rounded-full font-bold transition-all ${
							camOn 
								? 'bg-gray-100 text-black hover:bg-gray-200 hover:-translate-y-1 hover:shadow-brutalHover' 
								: 'bg-red-500 text-white shadow-brutal translate-x-[2px] translate-y-[2px]'
						}`}
                        title={camOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>
                    
					{/* Mic Toggle */}
					<button 
                        onClick={toggleMic} 
                        className={`w-14 h-14 flex items-center justify-center border-[3px] border-borderMain rounded-full font-bold transition-all ${
							micOn 
								? 'bg-gray-100 text-black hover:bg-gray-200 hover:-translate-y-1 hover:shadow-brutalHover' 
								: 'bg-red-500 text-white shadow-brutal translate-x-[2px] translate-y-[2px]'
						}`}
                        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
                    >
                        {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>
                    
					<div className="w-[3px] h-10 bg-borderMain md:mx-4 opacity-50"></div>
                    
					{/* Screen Share Swap Toggle */}
					<button 
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare} 
                        className={`px-6 py-3 h-14 flex items-center gap-2 border-[3px] border-borderMain font-bold uppercase tracking-wider text-sm transition-all ${
							!isScreenSharing 
								? 'bg-accentBlue text-black hover:bg-white hover:-translate-y-1 hover:shadow-brutalHover' 
								: 'bg-red-500 text-white shadow-brutal translate-x-[2px] translate-y-[2px]'
						}`}
                        title={isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
                    >
                        {!isScreenSharing ? (
							<>
								<MonitorUp className="w-5 h-5" /> 
								<span className="hidden sm:inline">Share</span>
							</>
						) : (
							<>
								<X className="w-5 h-5" /> 
								<span className="hidden sm:inline">Stop</span>
							</>
						)}
                    </button>
                </div>

			</div>
		</RequireAuth>
	);
}
