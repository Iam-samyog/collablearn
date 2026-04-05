'use client';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

export function UserMenu() {
	const { user, logout } = useAuth();

	if (!user) {
		return (
			<div className="flex items-center gap-3 text-sm">
				<Link href="/login" className="hover:opacity-80">Login</Link>
				<Link href="/signup" className="hover:opacity-80">Sign up</Link>
			</div>
		);
	}
	const display = user.displayName || user.email || 'User';
	return (
		<div className="flex items-center gap-3 text-sm">
			<div className="px-2 py-1 rounded-md bg-white/5">{display}</div>
			<button className="hover:opacity-80" onClick={() => logout()}>Logout</button>
		</div>
	);
}

