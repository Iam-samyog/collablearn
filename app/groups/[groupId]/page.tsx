'use client';
import { useMemo, useEffect, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';

type Message = {
	id: string;
	text: string;
	uid: string;
	displayName?: string;
	createdAt: number;
};

export default function GroupChatPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');

	useEffect(() => {
		const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'asc'), limit(200));
		const unsub = onSnapshot(q, (snap) => {
			setMessages(snap.docs.map((d) => {
				const data = d.data() as any;
				return {
					id: d.id,
					text: data.text,
					uid: data.uid,
					displayName: data.displayName,
					createdAt: data.createdAt?.toMillis?.() ?? 0
				};
			}));
		});
		return () => unsub();
	}, [db, groupId]);

	async function sendMessage(e: React.FormEvent) {
		e.preventDefault();
		if (!user || !input.trim()) return;
		await addDoc(collection(db, 'groups', groupId, 'messages'), {
			text: input.trim(),
			uid: user.uid,
			displayName: user.displayName || user.email,
			createdAt: serverTimestamp()
		});
		setInput('');
	}

	return (
		<RequireAuth>
			<div className="flex flex-col h-full w-full bg-white relative overflow-hidden p-12">
				{/* Maximalist Backdrop */}
				<div className="absolute top-0 right-0 text-[30vw] font-black uppercase text-black/[0.01] select-none pointer-events-none -translate-x-1/4 leading-none">
					CHAT
				</div>

				<div className="relative z-10 flex flex-col h-full max-w-[1200px] mx-auto w-full">
					<div className="mb-12 flex items-center justify-between px-4">
						<h2 className="text-5xl font-black uppercase tracking-tighter text-deepInk">
							Group <span className="text-neonLime">Chat</span>
						</h2>
						<div className="text-[10px] font-black uppercase tracking-[0.5em] text-deepInk/20">
							/ Real-time Stream
						</div>
					</div>
					
					<div className="flex-1 overflow-y-auto px-4 py-8 space-y-10 custom-scrollbar">
						{messages.length === 0 && (
							<div className="flex flex-col items-center justify-center h-full opacity-20">
								<p className="text-4xl font-black uppercase tracking-tighter italic">Silence is golden.</p>
								<p className="text-[10px] font-bold uppercase tracking-[0.5em] mt-4">But talking is better.</p>
							</div>
						)}
						{messages.map((m) => {
							const isMe = m.uid === user?.uid;
							return (
								<div key={m.id} className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
									<div className={`flex items-baseline gap-4 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
										<span className="text-[10px] font-black uppercase tracking-[0.2em] text-deepInk">
											{isMe ? 'YOU' : (m.displayName ?? 'ANON')}
										</span>
										<span className="text-[8px] font-bold text-deepInk/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
											{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
									</div>
									<div 
										className={`px-8 py-4 rounded-[2rem] max-w-[85%] md:max-w-[65%] shadow-soft hover:shadow-max transition-all duration-500 ${
											isMe ? 'bg-deepInk text-white rounded-tr-none' : 'bg-neonLime text-deepInk rounded-tl-none'
										}`}
									>
										<p className="text-sm font-bold leading-relaxed">{m.text}</p>
									</div>
								</div>
							);
						})}
					</div>

					<div className="pt-12 shrink-0 px-4">
						<form onSubmit={sendMessage} className="relative flex items-center">
							<input
								placeholder="SEND A MESSAGE..."
								value={input}
								onChange={(e) => setInput(e.target.value)}
								className="w-full bg-black/5 hover:bg-black/[0.08] focus:bg-white border-0 rounded-full px-10 py-6 text-xs font-black uppercase tracking-widest transition-all focus-ring placeholder-black/20"
							/>
							<div className="absolute right-3">
								<Button 
									variant="accent" 
									type="submit" 
									className="w-14 h-14 p-0 rounded-full bg-neonLime"
									disabled={!input.trim()}
								>
									<svg className="w-5 h-5 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
									</svg>
								</Button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}
