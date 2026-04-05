import Link from 'next/link';

export default function GroupLayout({ children, params }: { children: React.ReactNode; params: { groupId: string } }) {
	const { groupId } = params;
	return (
		<div className="max-w-6xl mx-auto px-4 py-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Group Workspace</h1>
				<Link className="text-sm text-muted" href="/groups">Back to groups</Link>
			</div>
			<nav className="mt-4 border-b border-white/5 flex gap-4 text-sm">
				<Link href={`/groups/${groupId}`} className="px-2 py-2 hover:opacity-80">Chat</Link>
				<Link href={`/groups/${groupId}/board`} className="px-2 py-2 hover:opacity-80">Board</Link>
				<Link href={`/groups/${groupId}/video`} className="px-2 py-2 hover:opacity-80">Video</Link>
				<Link href={`/groups/${groupId}/quizzes`} className="px-2 py-2 hover:opacity-80">Quizzes</Link>
				<Link href={`/groups/${groupId}/music`} className="px-2 py-2 hover:opacity-80">Music</Link>
			</nav>
			<div className="mt-6">
				{children}
			</div>
		</div>
	);
}

