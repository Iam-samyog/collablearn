'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, serverTimestamp, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Eraser, Trash2, PenTool, Hand, Check, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

type Stroke = {
	id: string;
	path: string;
	color: string;
	width: number;
	createdAt: number;
	uid: string;
};

const COLORS = [
	{ name: 'Black', hex: '#000000' },
	{ name: 'Red', hex: '#FF0000' },
	{ name: 'Blue', hex: '#47E1FF' },
	{ name: 'Yellow', hex: '#FFE347' },
	{ name: 'Pink', hex: '#FF88DD' },
	{ name: 'Green', hex: '#A0FFA0' },
	{ name: 'White', hex: '#FFFFFF' },
];

const THICKNESS = [
	{ name: 'Thin', value: 2 },
	{ name: 'Medium', value: 6 },
	{ name: 'Thick', value: 14 },
];

export default function BoardPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	
	const [strokes, setStrokes] = useState<Stroke[]>([]);
	const [color, setColor] = useState('#000000');
	const [width, setWidth] = useState(2);
	const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'pan'>('pen');
	const [clearing, setClearing] = useState(false);

	const [camera, setCamera] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [currentPath, setCurrentPath] = useState<string>('');
	
	const interactionRef = useRef<'none' | 'draw' | 'pan'>('none');
	const pathBuilderRef = useRef<string>('');
	const svgRef = useRef<SVGSVGElement>(null);

	// Spacebar panning
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === 'Space' && (e.target === document.body || e.target === svgRef.current)) {
				e.preventDefault();
				svgRef.current!.style.cursor = 'grab';
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				svgRef.current!.style.cursor = '';
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		}
	}, []);

	// Intelligently handle exact center or pointer zooming
	const performZoom = useCallback((direction: 1 | -1, clientX?: number, clientY?: number) => {
		setZoom((prevZoom) => {
			const factor = direction > 0 ? 1.15 : 1 / 1.15; // Smooth 15% interval
			const newZoom = Math.min(Math.max(0.1, prevZoom * factor), 10);
			if (newZoom === prevZoom) return prevZoom; // Cap
			
			setCamera((c) => {
				const svg = svgRef.current;
				let px = 0.5;
				let py = 0.5;
				
				// Focus zoom actively on the cursor position
				if (svg && clientX !== undefined && clientY !== undefined) {
					const rect = svg.getBoundingClientRect();
					px = (clientX - rect.left) / rect.width;
					py = (clientY - rect.top) / rect.height;
				}
				
				const newX = c.x + px * (1000 / prevZoom) - px * (1000 / newZoom);
				const newY = c.y + py * (1000 / prevZoom) - py * (1000 / newZoom);
				return { x: newX, y: newY };
			});

			return newZoom;
		});
	}, []);

	const resetViewport = () => {
		setCamera({ x: 0, y: 0 });
		setZoom(1);
	};

	// Advanced Wheel support for Trackpad Panning & Pinch-to-Zoom
	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			
			if (e.ctrlKey || e.metaKey) {
				// Zooming (pinch on trackpad or ctrl+wheel)
				// deltaY depends heavily on the device hardware mapping, standard wheel implies direction
				const direction = e.deltaY < 0 ? 1 : -1;
				performZoom(direction, e.clientX, e.clientY);
			} else {
				// Physical scroll pan logic - mapping wheel deltas to exact view offset coordinates!
				// React state will smoothly adapt the viewBox.
				setZoom(z => {
					setCamera(c => ({
						x: c.x + (e.deltaX / z),
						y: c.y + (e.deltaY / z)
					}));
					return z;
				});
			}
		};
		svg.addEventListener('wheel', handleWheel, { passive: false });
		return () => svg.removeEventListener('wheel', handleWheel);
	}, [performZoom]);

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
		const pt = svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
		return { x: +svgP.x.toFixed(1), y: +svgP.y.toFixed(1) };
	}

	function onPointerDown(e: React.PointerEvent) {
		if (!user) return;
		svgRef.current?.setPointerCapture(e.pointerId);

		if (activeTool === 'pan' || e.button === 1 || e.buttons === 4) {
			interactionRef.current = 'pan';
			return;
		}

		interactionRef.current = 'draw';
		const { x, y } = getPoint(e);
		const initialPath = `M ${x} ${y}`;
		pathBuilderRef.current = initialPath;
		setCurrentPath(initialPath);
	}

	function onPointerMove(e: React.PointerEvent) {
		if (interactionRef.current === 'none' || !user) return;
		
		if (interactionRef.current === 'pan') {
			const ctm = svgRef.current!.getScreenCTM();
			if (!ctm) return;
			const scale = 1 / ctm.a;
			setCamera((prev) => ({
				x: prev.x - e.movementX * scale,
				y: prev.y - e.movementY * scale
			}));
			return;
		}

		if (interactionRef.current === 'draw') {
			const { x, y } = getPoint(e);
			const addition = ` L ${x} ${y}`;
			pathBuilderRef.current += addition;
			setCurrentPath(pathBuilderRef.current);
		}
	}

	async function onPointerUp(e: React.PointerEvent) {
		if (!user || interactionRef.current === 'none') return;
		
		const wasDrawing = interactionRef.current === 'draw';
		interactionRef.current = 'none';
		svgRef.current?.releasePointerCapture(e.pointerId);

		if (!wasDrawing) return;
		
		const path = pathBuilderRef.current;
		pathBuilderRef.current = '';
		setCurrentPath('');

		if (!path || path.length < 5) return;

		const strokeColor = activeTool === 'eraser' ? '#FFFFFF' : color;
		const strokeWidth = activeTool === 'eraser' ? Math.max(width * 2, 20) : width;

		await addDoc(collection(db, 'groups', groupId, 'boardStrokes'), {
			path,
			color: strokeColor,
			width: strokeWidth,
			uid: user.uid,
			createdAt: serverTimestamp()
		});
	}

	async function clearBoard() {
		if (!user || window.confirm("Are you sure you want to clear the entire board?") === false) return;
		setClearing(true);
		try {
			const boardRef = collection(db, 'groups', groupId, 'boardStrokes');
			const snap = await getDocs(boardRef);
			const batch = writeBatch(db);
			snap.docs.forEach((doc) => batch.delete(doc.ref));
			await batch.commit();
		} catch (e) {
			console.error("Error clearing board:", e);
		} finally {
			setClearing(false);
		}
	}

	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<RequireAuth>
			<div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
				{/* Maximalist Background Texture */}
				<div className="absolute top-0 left-0 text-[35vw] font-black uppercase text-black/[0.02] select-none pointer-events-none -translate-x-1/4 -translate-y-1/4 leading-none">
					DRAFT
				</div>

				{/* Canvas Workspace */}
				<div 
					className={`flex-1 bg-white relative overflow-hidden group touch-none select-none z-10 ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
					tabIndex={0}
				>
					<svg
						ref={svgRef}
						viewBox={`${camera.x} ${camera.y} ${1000 / zoom} ${1000 / zoom}`}
						className="w-full h-full outline-none"
						preserveAspectRatio="xMidYMid slice"
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onPointerLeave={onPointerUp}
					>
						{strokes.map((s) => (
							<path 
								key={s.id} 
								d={s.path} 
								stroke={s.color} 
								strokeWidth={s.width} 
								fill="none" 
								strokeLinecap="round" 
								strokeLinejoin="round" 
							/>
						))}
						
						{currentPath && (
							<path 
								d={currentPath} 
								stroke={activeTool === 'eraser' ? '#FFFFFF' : color} 
								strokeWidth={activeTool === 'eraser' ? Math.max(width * 2, 20) : width} 
								fill="none" 
								strokeLinecap="round" 
								strokeLinejoin="round" 
							/>
						)}
					</svg>
				</div>

				{/* Floating Minimal-Max Toolbar Island */}
				<div className="fixed bottom-12 left-0 right-0 flex justify-center z-50 pointer-events-none px-6">
					<div className="bg-white/80 backdrop-blur-3xl border border-white/20 shadow-max rounded-[3rem] px-8 py-5 flex flex-wrap items-center gap-8 pointer-events-auto max-w-[1400px]">
						
						{/* Core Tools */}
						<div className="flex items-center gap-4">
							<ToolButton 
								active={activeTool === 'pen'} 
								onClick={() => setActiveTool('pen')}
								label="PEN"
								icon={<PenTool className="w-5 h-5" />}
								color="bg-neonLime"
							/>
							<ToolButton 
								active={activeTool === 'pan'} 
								onClick={() => setActiveTool('pan')}
								label="MOVE"
								icon={<Hand className="w-5 h-5" />}
								color="bg-softBlush"
							/>
							<ToolButton 
								active={activeTool === 'eraser'} 
								onClick={() => setActiveTool('eraser')}
								label="ERASE"
								icon={<Eraser className="w-5 h-5" />}
								color="bg-red-500"
							/>
						</div>

						<div className="w-[1px] h-10 bg-black/10 mx-2"></div>

						{/* Thickness */}
						<div className="flex items-center gap-3">
							{THICKNESS.map((t) => (
								<button
									key={t.name}
									onClick={() => setWidth(t.value)}
									className={`text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full transition-all ${
										width === t.value && activeTool === 'pen' ? 'bg-deepInk text-white' : 'hover:bg-black/5 text-deepInk/40'
									}`}
								>
									{t.name}
								</button>
							))}
						</div>

						<div className="w-[1px] h-10 bg-black/10 mx-2"></div>

						{/* Colors */}
						<div className={`flex items-center gap-3 ${activeTool === 'eraser' ? 'opacity-20 pointer-events-none' : ''}`}>
							{COLORS.map((c) => (
								<button
									key={c.name}
									onClick={() => setColor(c.hex)}
									style={{ backgroundColor: c.hex }}
									className={`w-8 h-8 rounded-full border border-black/5 transition-all duration-300 hover:scale-125 ${
										color === c.hex ? 'ring-4 ring-neonLime scale-110 shadow-soft' : ''
									}`}
									title={c.name}
								/>
							))}
						</div>

						<div className="w-[1px] h-10 bg-black/10 mx-2"></div>

						{/* Action Buttons */}
						<div className="flex items-center gap-4">
							<button 
								onClick={() => setIsExpanded(!isExpanded)}
								className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-neonLime text-deepInk rotate-180' : 'bg-black/5 text-deepInk hover:bg-black/10'}`}
							>
								<Maximize className="w-4 h-4" />
							</button>
							<button 
								onClick={clearBoard}
								disabled={clearing}
								className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>

				{/* Floating Zoom Controls (Bottom Right) */}
				<div 
					className={`fixed bottom-12 right-12 flex flex-col gap-4 z-50 transition-all duration-700 ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}
				>
					<div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-max rounded-[2rem] p-3 flex flex-col gap-2">
						<button onClick={() => performZoom(1)} className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center hover:bg-neonLime transition-all">
							<ZoomIn className="w-4 h-4" />
						</button>
						<div className="text-[10px] font-black text-center font-poppins">{Math.round(zoom * 100)}%</div>
						<button onClick={() => performZoom(-1)} className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center hover:bg-neonLime transition-all">
							<ZoomOut className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}

function ToolButton({ active, onClick, label, icon, color }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode, color: string }) {
	return (
		<button 
			onClick={onClick}
			className={`group flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 ${active ? `${color} text-deepInk shadow-soft scale-105` : 'bg-black/5 text-deepInk/40 hover:bg-black/10'}`}
		>
			<div className={`${active ? 'text-deepInk' : 'group-hover:text-deepInk'} transition-colors`}>
				{icon}
			</div>
			<span className={`text-[10px] font-black tracking-[0.4em] transition-all ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
				{label}
			</span>
		</button>
	);
}
