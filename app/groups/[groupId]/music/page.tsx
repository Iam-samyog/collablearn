'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';

type PlayerState = {
	tracks: string[];
	currentIndex: number;
	isPlaying: boolean;
};

export default function MusicPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	const [state, setState] = useState<PlayerState>({ tracks: [], currentIndex: 0, isPlaying: false });
	const [newUrl, setNewUrl] = useState('');
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		const ref = doc(db, 'groups', groupId, 'player', 'state');
		const unsub = onSnapshot(ref, (snap) => {
			const data = snap.data() as any;
			if (data) {
				const next: PlayerState = {
					tracks: data.tracks || [],
					currentIndex: data.currentIndex || 0,
					isPlaying: !!data.isPlaying
				};
				setState(next);
			} else {
				// initialize
				setDoc(ref, { tracks: [], currentIndex: 0, isPlaying: false, updatedAt: serverTimestamp() }, { merge: true });
			}
		});
		return () => unsub();
	}, [db, groupId]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		if (state.tracks[state.currentIndex]) {
			audio.src = state.tracks[state.currentIndex];
			if (state.isPlaying) audio.play().catch(() => {});
			else audio.pause();
		} else {
			audio.pause();
		}
	}, [state]);

	async function addTrack() {
		if (!newUrl.trim()) return;
		const ref = doc(db, 'groups', groupId, 'player', 'state');
		await setDoc(ref, {
			tracks: [...state.tracks, newUrl.trim()],
			updatedAt: serverTimestamp()
		}, { merge: true });
		setNewUrl('');
	}

	async function playPause() {
		const ref = doc(db, 'groups', groupId, 'player', 'state');
		await updateDoc(ref, { isPlaying: !state.isPlaying, updatedAt: serverTimestamp() });
	}
	async function next() {
		const ref = doc(db, 'groups', groupId, 'player', 'state');
		const nextIdx = (state.currentIndex + 1) % Math.max(state.tracks.length, 1);
		await updateDoc(ref, { currentIndex: nextIdx, isPlaying: true, updatedAt: serverTimestamp() });
	}
	async function prev() {
		const ref = doc(db, 'groups', groupId, 'player', 'state');
		const nextIdx = (state.currentIndex - 1 + Math.max(state.tracks.length, 1)) % Math.max(state.tracks.length, 1);
		await updateDoc(ref, { currentIndex: nextIdx, isPlaying: true, updatedAt: serverTimestamp() });
	}

	return (
		<RequireAuth>
			<div className="flex flex-col h-full w-full bg-white relative overflow-hidden p-12">
				{/* Maximalist Backdrop */}
				<div className="absolute top-0 right-0 text-[35vw] font-black text-black/[0.01] select-none pointer-events-none -translate-y-1/4 translate-x-1/4 leading-none">
					SOUND
				</div>

				<div className="relative z-10 flex flex-col h-full max-w-[1400px] mx-auto w-full">
					<div className="mb-16 flex items-center justify-between px-4">
						<h2 className="text-5xl font-black tracking-tighter text-deepInk">
							Music <span className="text-neonLime">Room</span>
						</h2>
						<div className="text-[10px] font-black tracking-[0.5em] text-deepInk/20">
							/ Synced Audio Stream
						</div>
					</div>

					<div className="grid md:grid-cols-12 gap-12 h-full min-h-0">
						{/* Playlist Sidebar */}
						<div className="md:col-span-4 flex flex-col gap-10 overflow-hidden">
							<div className="bg-black/5 p-10 rounded-[3rem] flex flex-col gap-8 shrink-0">
								<div className="flex flex-col gap-2">
									<h3 className="text-[10px] font-black tracking-[0.3em] text-deepInk/40">01. Source Control</h3>
									<h4 className="text-3xl font-black tracking-tighter text-deepInk">Add Track</h4>
								</div>
								<div className="flex flex-col gap-4">
									<input
										placeholder="AUDIO LINK (MP3/WAV)..."
										value={newUrl}
										onChange={(e) => setNewUrl(e.target.value)}
										className="w-full bg-white rounded-full px-8 py-5 text-[10px] font-black tracking-widest border-0 focus-ring shadow-soft"
									/>
									<Button variant="accent" size="lg" className="w-full py-6" onClick={addTrack}>Inject to Stream</Button>
								</div>
							</div>

							<div className="flex-1 flex flex-col gap-6 overflow-hidden">
								<div className="px-4">
									<h3 className="text-[10px] font-black tracking-[0.3em] text-deepInk/40 mb-2">02. Queue List</h3>
									<h4 className="text-2xl font-black tracking-tighter text-deepInk">Current Rotation</h4>
								</div>
								<div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar pb-12">
									{state.tracks.map((t, i) => (
										<div 
											key={i} 
											className={`group flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 ${i === state.currentIndex ? 'bg-deepInk text-white shadow-max translate-x-2' : 'hover:bg-black/5'}`}
										>
											<div className="flex items-center gap-6">
												<span className={`text-[10px] font-black ${i === state.currentIndex ? 'text-neonLime' : 'text-deepInk/20'}`}>0{i + 1}</span>
												<span className="text-[10px] font-black tracking-widest truncate max-w-[200px]">{t.split('/').pop()}</span>
											</div>
											{i === state.currentIndex && <div className="w-1.5 h-1.5 rounded-full bg-neonLime animate-pulse"></div>}
										</div>
									))}
									{state.tracks.length === 0 && (
										<p className="text-[10px] font-black tracking-widest text-deepInk/20 px-2 italic">Queue is empty...</p>
									)}
								</div>
							</div>
						</div>

						{/* Massive Player Area */}
						<div className="md:col-span-8 flex flex-col items-center justify-center relative bg-white pb-24">
							<div className="relative group cursor-pointer" onClick={playPause}>
								{/* Pulse Rings */}
								<div className={`absolute inset-0 rounded-full bg-neonLime/20 animate-ping duration-[2000ms] ${!state.isPlaying && 'opacity-0'}`}></div>
								<div className={`absolute -inset-8 rounded-full border border-neonLime/10 ${!state.isPlaying && 'opacity-0'}`}></div>
								
								<button 
									className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-[800ms] shadow-max ${state.isPlaying ? 'bg-deepInk scale-110 rotate-180' : 'bg-neonLime hover:scale-105'}`}
								>
									{state.isPlaying ? (
										<div className="flex gap-4">
											<div className="w-4 h-16 bg-neonLime rounded-full"></div>
											<div className="w-4 h-16 bg-neonLime rounded-full"></div>
										</div>
									) : (
										<div className="w-0 h-0 border-t-[30px] border-t-transparent border-l-[50px] border-l-deepInk border-b-[30px] border-b-transparent translate-x-2"></div>
									)}
								</button>
							</div>

							<div className="mt-20 flex flex-col items-center gap-8">
								<div className="flex flex-col items-center gap-2">
									<span className="text-[10px] font-black tracking-[0.8em] text-deepInk/20">Now Streaming</span>
									<h3 className="text-4xl font-black tracking-tighter text-deepInk italic text-center max-w-[600px] leading-tight break-words px-8">
										{state.tracks[state.currentIndex]?.split('/').pop() || "Silence."}
									</h3>
								</div>

								<div className="flex items-center gap-12 mt-4">
									<button onClick={prev} className="group p-4 hover:translate-x-[-8px] transition-all duration-500">
										<div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[18px] border-r-deepInk/20 group-hover:border-r-neonLime border-b-[10px] border-b-transparent"></div>
									</button>
									<button onClick={next} className="group p-4 hover:translate-x-[8px] transition-all duration-500">
										<div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-deepInk/20 group-hover:border-l-neonLime border-b-[10px] border-b-transparent"></div>
									</button>
								</div>
							</div>

							<audio ref={audioRef} className="hidden" />
						</div>
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}

