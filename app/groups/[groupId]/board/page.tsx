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

	return (
		<RequireAuth>
			<div className="flex flex-col h-full w-full card bg-bg relative">
				{/* Neo-brutalist Toolbar */}
				<div className="p-4 border-b-[3px] border-borderMain bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-4 z-10 shrink-0">
					<div className="flex items-center gap-6 overflow-x-auto py-2 px-1 xl:py-2 custom-scrollbar">
						
						{/* Tools Section */}
						<div className="flex items-center gap-2 shrink-0">
							<button 
								onClick={() => setActiveTool('pen')}
								className={`flex items-center gap-2 px-3 py-2 border-[3px] border-borderMain font-bold uppercase transition-all ${
									activeTool === 'pen' ? 'bg-accentBlue shadow-brutal translate-x-[2px] translate-y-[2px]' : 'hover:bg-gray-100 hover:shadow-brutalHover hover:-translate-x-[1px] hover:-translate-y-[1px]'
								}`}
							>
								<PenTool className="w-4 h-4" /> Pen
							</button>
							<button 
								onClick={() => setActiveTool('pan')}
								className={`flex items-center gap-2 px-3 py-2 border-[3px] border-borderMain font-bold uppercase transition-all ${
									activeTool === 'pan' ? 'bg-accentPink shadow-brutal translate-x-[2px] translate-y-[2px]' : 'hover:bg-gray-100 hover:shadow-brutalHover hover:-translate-x-[1px] hover:-translate-y-[1px]'
								}`}
							>
								<Hand className="w-4 h-4" /> Pan
							</button>
							<button 
								onClick={() => setActiveTool('eraser')}
								className={`flex items-center gap-2 px-3 py-2 border-[3px] border-borderMain font-bold uppercase transition-all ${
									activeTool === 'eraser' ? 'bg-accentYellow shadow-brutal translate-x-[2px] translate-y-[2px]' : 'hover:bg-gray-100 hover:shadow-brutalHover hover:-translate-x-[1px] hover:-translate-y-[1px]'
								}`}
							>
								<Eraser className="w-4 h-4" /> Eraser
							</button>
						</div>

						{/* Thickness */}
						<div className="flex items-center gap-2 border-l-[3px] border-borderMain pl-6 shrink-0">
							{THICKNESS.map((t) => (
								<button
									key={t.name}
									onClick={() => setWidth(t.value)}
									className={`px-3 py-2 border-[3px] border-borderMain font-bold uppercase text-xs transition-all ${
										width === t.value && activeTool === 'pen' ? 'bg-black text-white shadow-brutal translate-x-[2px] translate-y-[2px]' : 'hover:bg-gray-100 hover:shadow-brutalHover hover:-translate-x-[1px] hover:-translate-y-[1px]'
									}`}
								>
									{t.name}
								</button>
							))}
						</div>

						{/* Colors */}
						<div className={`flex items-center gap-2 border-l-[3px] border-borderMain pl-6 shrink-0 ${activeTool === 'eraser' ? 'opacity-30 pointer-events-none' : ''}`}>
							{COLORS.map((c) => {
								const isActive = color === c.hex;
								return (
									<button
										key={c.name}
										onClick={() => setColor(c.hex)}
										style={{ backgroundColor: c.hex }}
										className={`relative w-8 h-8 flex items-center justify-center border-[3px] border-borderMain transition-all duration-200 ${
											isActive ? 'rounded-lg scale-110 shadow-brutal translate-x-[1px] translate-y-[1px]' : 'rounded-full hover:scale-110'
										}`}
										title={c.name}
									>
										{isActive && (
											<Check strokeWidth={4} className={`w-4 h-4 ${c.hex === '#FFFFFF' || c.hex === '#FFE347' ? 'text-black' : 'text-white'}`} />
										)}
									</button>
								);
							})}
						</div>

						{/* Zoom Controls */}
						<div className="flex items-center gap-1 border-l-[3px] border-borderMain pl-6 shrink-0">
							<button onClick={() => performZoom(-1)} className="p-2 border-[3px] border-borderMain bg-white hover:bg-gray-100 hover:-translate-y-[1px] transition-all rounded-md" title="Zoom Out">
								<ZoomOut className="w-4 h-4" />
							</button>
							<div className="w-12 text-center text-xs font-bold font-poppins">{Math.round(zoom * 100)}%</div>
							<button onClick={() => performZoom(1)} className="p-2 border-[3px] border-borderMain bg-white hover:bg-gray-100 hover:-translate-y-[1px] transition-all rounded-md" title="Zoom In">
								<ZoomIn className="w-4 h-4" />
							</button>
							<button onClick={resetViewport} className="p-2 border-[3px] border-borderMain bg-white hover:bg-gray-100 hover:-translate-y-[1px] transition-all rounded-md ml-1" title="Reset Viewport">
								<Maximize className="w-4 h-4" />
							</button>
						</div>
					</div>

					<button 
						onClick={clearBoard}
						disabled={clearing}
						className="flex items-center justify-center gap-2 px-4 py-2 border-[3px] border-borderMain font-bold uppercase bg-red-400 hover:bg-red-500 text-white transition-all hover:shadow-brutalHover shrink-0"
					>
						<Trash2 className="w-4 h-4" /> {clearing ? "..." : "Clear"}
					</button>
				</div>
				
				{/* Canvas Workspace */}
				<div 
					className={`flex-1 bg-surface relative overflow-hidden group touch-none select-none ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
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
			</div>
		</RequireAuth>
	);
}
