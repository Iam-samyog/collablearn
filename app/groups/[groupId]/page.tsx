'use client';
import { useMemo, useEffect, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';

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
		<div className="grid md:grid-cols-3 gap-6">
			<div className="md:col-span-2 card p-4 flex flex-col min-h-[420px]">
				<div className="flex-1 space-y-2 overflow-y-auto pr-2">
					{messages.map((m) => (
						<div key={m.id} className="flex items-start gap-2">
							<div className="text-xs text-muted min-w-[120px]">
								{m.displayName ?? 'Unknown'}
							</div>
							<div className="flex-1">
								<div className="text-white">{m.text}</div>
							</div>
						</div>
					))}
					{messages.length === 0 && <div className="text-muted text-sm">No messages yet. Say hello!</div>}
				</div>
				<form onSubmit={sendMessage} className="mt-3 flex gap-2">
					<input
						placeholder="Message"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						className="flex-1"
					/>
					<button className="primary px-4 rounded-md">Send</button>
				</form>
			</div>
			<aside className="card p-4">
				<div className="text-sm text-muted">This is your group chat. Use the tabs above to access the whiteboard, video calls, quizzes, and music player.</div>
			</aside>
		</div>
		</RequireAuth>
	);
}

