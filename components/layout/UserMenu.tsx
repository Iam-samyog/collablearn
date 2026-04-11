'use client';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export function UserMenu() {
	const { user, logout } = useAuth();

	if (!user) {
		return (
			<div className="flex items-center gap-3">
				<Link href="/login">
					<span className="inline-flex items-center px-5 py-2.5 rounded-full border-2 border-deepInk text-deepInk text-sm font-poppins font-bold hover:bg-deepInk hover:text-white transition-all duration-300">
						Login
					</span>
				</Link>
				<Link href="/signup">
					<span className="inline-flex items-center gap-2 px-6 py-2.5 bg-deepInk text-neonLime text-sm font-poppins font-bold rounded-full hover:scale-105 hover:shadow-xl transition-all duration-300">
						Sign up
						<span className="w-5 h-5 rounded-full bg-neonLime flex items-center justify-center text-deepInk text-xs font-black">→</span>
					</span>
				</Link>
			</div>
		);
	}

	const display = user.displayName || user.email?.split('@')[0] || 'Member';

	return (
		<div className="flex items-center gap-2 bg-deepInk rounded-full pl-1 pr-4 py-1">
			{/* Avatar */}
			<div className="relative shrink-0">
				<div className="w-8 h-8 rounded-full bg-neonLime flex items-center justify-center">
					<span className="text-deepInk font-poppins font-black text-sm leading-none">
						{display[0].toUpperCase()}
					</span>
				</div>
				<span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-deepInk rounded-full"></span>
			</div>

			{/* Name */}
			<span className="text-sm font-poppins font-semibold text-white hidden md:block max-w-[100px] truncate px-1">
				{display}
			</span>

			{/* Sign out */}
			<button
				onClick={() => logout()}
				className="text-xs font-poppins font-bold text-white/50 hover:text-red-400 transition-colors duration-200 pl-2 border-l border-white/10"
			>
				Out
			</button>
		</div>
	);
}

