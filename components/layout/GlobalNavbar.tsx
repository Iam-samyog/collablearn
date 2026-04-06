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
			<header className="pointer-events-auto bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft flex items-center justify-between px-10 py-5 w-full max-w-[1400px] gap-12 rounded-full">
				{/* Brand Logo - Maximalist Type */}
				<Link href="/" className="inline-flex items-center gap-0 group">
					<span className="text-4xl font-poppins font-black uppercase tracking-tighter text-textMain transition-all leading-none group-hover:tracking-normal">COLLAB</span>
					<span className="text-4xl font-poppins font-black uppercase tracking-tighter text-neonLime bg-deepInk px-3 py-1 leading-none -rotate-1 group-hover:rotate-0 transition-all">LEARN</span>
				</Link>

				{/* Primary Nav - Minimalist */}
				<nav className="flex items-center gap-10">
					<Link 
						href="/groups" 
						className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-textMain/40 hover:text-textMain transition-all relative after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-[2px] after:bg-neonLime hover:after:w-full after:transition-all after:duration-500"
					>
						Explore Groups
					</Link>
					
					<div className="h-6 w-[1px] bg-black/10 hidden sm:block"></div>

					<UserMenu />
				</nav>
			</header>
		</div>
	);
}
