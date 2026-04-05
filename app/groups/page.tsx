'use client';
import { initFirebase } from '@/lib/firebase';
import { addDoc, arrayUnion, collection, doc, getDocs, onSnapshot, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import Link from 'next/link';
import type { Group } from '@/lib/types';

type GroupDoc = Omit<Group, 'id' | 'createdAt' | 'updatedAt'> & {
	createdAt: Timestamp | null;
	updatedAt: Timestamp | null;
};

export default function GroupsPage() {
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	const [groups, setGroups] = useState<Group[]>([]);
	const [name, setName] = useState('');
	const [isPrivate, setIsPrivate] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const q = query(collection(db, 'groups'));
		const unsub = onSnapshot(q, (snap) => {
			const list: Group[] = snap.docs.map((d) => {
				const data = d.data() as GroupDoc;
				return {
					id: d.id,
					name: data.name,
					isPrivate: data.isPrivate,
					ownerId: data.ownerId,
					memberIds: data.memberIds ?? [],
					createdAt: data.createdAt ? data.createdAt.toMillis() : 0,
					updatedAt: data.updatedAt ? data.updatedAt.toMillis() : 0
				};
			});
			setGroups(list);
			setLoading(false);
		});
		return () => unsub();
	}, [db]);

	async function createGroup(e: React.FormEvent) {
		e.preventDefault();
		if (!user) return;
		await addDoc(collection(db, 'groups'), {
			name,
			isPrivate,
			ownerId: user.uid,
			memberIds: [user.uid],
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		});
		setName('');
		setIsPrivate(false);
	}

	async function joinGroup(groupId: string) {
		if (!user) return;
		const ref = doc(db, 'groups', groupId);
		await updateDoc(ref, {
			memberIds: arrayUnion(user.uid),
			updatedAt: serverTimestamp()
		});
	}

	return (
		<RequireAuth>
		<div className="max-w-6xl mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-semibold">Study Groups</h1>
					<p className="text-sm text-muted">Create or join a group to start collaborating</p>
				</div>
			</div>

			<div className="grid md:grid-cols-3 gap-6">
				<div className="card p-4 md:col-span-1">
					<h2 className="font-medium">Create group</h2>
					<form onSubmit={createGroup} className="mt-3 space-y-3">
						<input
							placeholder="Group name"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full"
						/>
						<label className="flex items-center gap-2 text-sm text-muted">
							<input
								type="checkbox"
								checked={isPrivate}
								onChange={(e) => setIsPrivate(e.target.checked)}
							/>
							Private group
						</label>
						<button className="primary w-full py-2 rounded-md" disabled={!user}>
							Create
						</button>
					</form>
				</div>
				<div className="md:col-span-2 space-y-3">
					{loading && <div className="text-muted">Loading groups…</div>}
					{!loading && groups.length === 0 && (
						<div className="text-muted">No groups yet. Create the first one!</div>
					)}
					{groups.map((g) => (
						<div key={g.id} className="card p-4 flex items-center justify-between">
							<div>
								<div className="font-medium">{g.name}</div>
								<div className="text-xs text-muted">
									{g.isPrivate ? 'Private' : 'Public'} • {g.memberIds.length} members
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Link href={`/groups/${g.id}`} className="px-3 py-2 border border-white/10 rounded-md hover:bg-white/5">
									Open
								</Link>
								{user && !g.memberIds.includes(user.uid) && (
									<button className="primary px-3 py-2 rounded-md" onClick={() => joinGroup(g.id)}>
										Join
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
		</RequireAuth>
	);
}

