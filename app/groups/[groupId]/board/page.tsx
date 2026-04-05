'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';

type Stroke = {
	id: string;
	path: string; // SVG path data
	color: string;
	width: number;
	createdAt: number;
	uid: string;
};

export default function BoardPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	const [strokes, setStrokes] = useState<Stroke[]>([]);
	const [color, setColor] = useState('#67E8F9');
	const [width, setWidth] = useState(2);
	const drawing = useRef(false);
	const pathRef = useRef<string>('');
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const unsub = onSnapshot(collection(db, 'groups', groupId, 'boardStrokes'), (snap) => {
			setStrokes(snap.docs.map((d) => {
				const data = d.data() as any;
				return {
					id: d.id,
					path: data.path,
					color: data.color,
					width: data.width,
					createdAt: data.createdAt?.toMillis?.() ?? 0,
					uid: data.uid
				};
			}));
		});
		return () => unsub();
	}, [db, groupId]);

	function getPoint(e: React.PointerEvent) {
		const svg = svgRef.current!;
		const rect = svg.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		return { x: +x.toFixed(2), y: +y.toFixed(2) };
	}

	function onPointerDown(e: React.PointerEvent) {
		if (!user) return;
		drawing.current = true;
		const { x, y } = getPoint(e);
		pathRef.current = `M ${x} ${y}`;
	}
	async function onPointerMove(e: React.PointerEvent) {
		if (!drawing.current) return;
		const { x, y } = getPoint(e);
		pathRef.current += ` L ${x} ${y}`;
	}
	async function onPointerUp() {
		if (!user) return;
		if (!drawing.current) return;
		drawing.current = false;
		const path = pathRef.current;
		pathRef.current = '';
		if (!path) return;
		await addDoc(collection(db, 'groups', groupId, 'boardStrokes'), {
			path,
			color,
			width,
			uid: user.uid,
			createdAt: serverTimestamp()
		});
	}

	return (
		<RequireAuth>
		<div className="space-y-4">
			<div className="flex items-center gap-3">
				<input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
				<input type="range" min={1} max={8} value={width} onChange={(e) => setWidth(parseInt(e.target.value))} />
			</div>
			<div className="card p-3">
				<svg
					ref={svgRef}
					viewBox="0 0 100 100"
					className="w-full aspect-video bg-white/3 rounded-lg touch-none"
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerLeave={onPointerUp}
				>
					{strokes.map((s) => (
						<path key={s.id} d={s.path} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
					))}
				</svg>
			</div>
		</div>
		</RequireAuth>
	);
}

