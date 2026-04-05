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
			<div className="flex flex-col h-full w-full card bg-bg relative">
				<div className="p-4 border-b-[3px] border-borderMain bg-accentBlue flex items-center justify-between">
					<h2 className="font-poppins font-bold text-xl uppercase tracking-wider">Group Chat</h2>
				</div>
				
				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					{messages.length === 0 && (
						<div className="text-gray-500 font-medium text-center mt-10">
							No messages yet. Start the conversation!
						</div>
					)}
					{messages.map((m) => {
						const isMe = m.uid === user?.uid;
						return (
							<div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
								<span className="text-xs font-bold mb-1 px-1">
									{isMe ? 'You' : (m.displayName ?? 'Unknown')}
								</span>
								<div 
									className={`px-4 py-3 border-[3px] border-borderMain shadow-brutal max-w-[80%] md:max-w-[70%] ${
										isMe ? 'bg-accentYellow' : 'bg-white'
									}`}
								>
									<p className="font-roboto font-medium whitespace-pre-wrap break-words">{m.text}</p>
								</div>
							</div>
						);
					})}
				</div>
				<div className="p-4 border-t-[3px] border-borderMain bg-white shrink-0">
					<form onSubmit={sendMessage} className="flex gap-4">
						<input
							placeholder="Type your message..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							className="flex-1 w-full"
						/>
						<Button variant="accent" type="submit">SEND MESSAGE</Button>
					</form>
				</div>
			</div>
		</RequireAuth>
	);
}
