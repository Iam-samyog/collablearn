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
					<Button variant="secondary" size="sm" className="shadow-none hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5">
						Login
					</Button>
				</Link>
				<Link href="/signup">
					<Button variant="accent" size="sm">
						Sign up
					</Button>
				</Link>
			</div>
		);
	}

	const display = user.displayName || user.email?.split('@')[0] || 'Member';

	return (
		<div className="flex items-center gap-6">
			<div className="flex items-center gap-3 group cursor-default">
				<div className="w-2 h-2 rounded-full bg-neonLime animate-pulse"></div>
				<span className="text-[10px] font-black uppercase tracking-[0.2em] text-textMain/60 group-hover:text-textMain transition-colors">
					{display}
				</span>
			</div>
			<Button variant="ghost" size="sm" onClick={() => logout()} className="text-[10px] hover:text-red-500 hover:bg-red-50/50">
				Sign out
			</Button>
		</div>
	);
}

