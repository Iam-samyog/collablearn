'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/layout/UserMenu';

export function GlobalNavbar() {
	const pathname = usePathname();

	// Hide the global navbar if we are inside a specific group dashboard
	if (pathname?.match(/^\/groups\/[^/]+/)) {
		return null;
	}

	return (
		<div className="fixed top-8 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
			<header className="pointer-events-auto bg-neonLime flex items-center justify-between px-10 py-5 w-full max-w-[1400px] gap-12 rounded-full shadow-lg">
				{/* Brand Logo */}
				<Link href="/" className="inline-flex items-center gap-1 group">
					<span className="text-3xl font-poppins font-black tracking-tight text-deepInk leading-none">Collab</span>
					<span className="text-3xl font-poppins font-black tracking-tight text-white bg-deepInk pr-3 pl-1 py-1 leading-none">Learn.</span>
				</Link>

				{/* Primary Nav */}
				<nav className="flex items-center gap-10">
					<Link 
						href="/groups" 
						className="hidden sm:block text-sm font-poppins font-semibold text-deepInk/60 hover:text-deepInk transition-all"
					>
						Explore Groups
					</Link>
					
					<div className="h-6 w-[1px] bg-deepInk/20 hidden sm:block"></div>

					<UserMenu />
				</nav>
			</header>
		</div>
	);
}
