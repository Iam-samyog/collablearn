'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';

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
		<div className="grid md:grid-cols-3 gap-6">
			<div className="card p-4 space-y-3">
				<h2 className="font-medium">Add track</h2>
				<input
					placeholder="Enter audio URL (mp3, etc.)"
					value={newUrl}
					onChange={(e) => setNewUrl(e.target.value)}
					className="w-full"
				/>
				<button className="primary w-full py-2 rounded-md" onClick={addTrack}>Add to playlist</button>
				<ul className="text-sm text-muted space-y-1">
					{state.tracks.map((t, i) => (
						<li key={i} className={i === state.currentIndex ? 'text-white' : ''}>
							{i === state.currentIndex ? '▶ ' : ''}{t}
						</li>
					))}
					{state.tracks.length === 0 && <li>No tracks yet.</li>}
				</ul>
			</div>
			<div className="md:col-span-2 card p-4">
				<div className="text-sm text-muted">Shared player</div>
				<div className="mt-3 flex items-center gap-3">
					<button className="px-3 py-2 border border-white/10 rounded-md hover:bg-white/5" onClick={prev}>Prev</button>
					<button className="primary px-3 py-2 rounded-md" onClick={playPause}>{state.isPlaying ? 'Pause' : 'Play'}</button>
					<button className="px-3 py-2 border border-white/10 rounded-md hover:bg-white/5" onClick={next}>Next</button>
				</div>
				<audio ref={audioRef} className="w-full mt-4" controls />
			</div>
		</div>
		</RequireAuth>
	);
}

