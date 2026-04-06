'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/layout/UserMenu';

export function GlobalNavbar() {
	const pathname = usePathname();

	// Hide the global navbar if we are inside a specific group dashboard
	// Paths like /groups/[groupId], /groups/[groupId]/chat, etc.
	if (pathname?.match(/^\/groups\/[^/]+/)) {
		return null;
	}

	return (
		<header className="border-b-[3px] border-borderMain sticky top-0 z-40 bg-bg">
			<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
				<Link href="/" className="text-2xl font-poppins font-bold tracking-tight uppercase">
					<span className="text-textMain">Collab</span>
					<span className="text-accentBlue">Learn</span>
				</Link>
				<nav className="flex items-center gap-4 text-sm font-poppins font-bold uppercase tracking-wider">
					<Link href="/groups" className="hover:underline decoration-2 underline-offset-4 decoration-accentBlue transition-colors">Groups</Link>
					<UserMenu />
				</nav>
			</div>
		</header>
	);
}
