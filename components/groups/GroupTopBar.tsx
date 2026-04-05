'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ShareDialog } from '@/components/share/ShareDialog';
import { Button } from '@/components/ui/Button';

export function GroupTopBar({ groupId }: { groupId: string }) {
	const [open, setOpen] = useState(false);
	const url = typeof window !== 'undefined' ? `${window.location.origin}/groups/${groupId}` : '';
	return (
		<div className="flex items-center justify-between">
			<h1 className="text-xl font-semibold">Group Workspace</h1>
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" onClick={() => setOpen(true)}>Share</Button>
				<Link className="text-sm text-muted" href="/groups">Back to groups</Link>
			</div>
			<ShareDialog open={open} onClose={() => setOpen(false)} url={url} title="Invite to this group" />
		</div>
	);
}

