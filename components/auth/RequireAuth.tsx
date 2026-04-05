'use client';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	if (loading) {
		return <div className="text-muted">Loading…</div>;
	}
	if (!user) {
		return (
			<div className="max-w-md mx-auto px-4 py-12 text-center">
				<div className="text-lg font-medium">You need to sign in</div>
				<p className="text-sm text-muted mt-2">Please <Link href="/login">login</Link> or <Link href="/signup">create an account</Link> to continue.</p>
			</div>
		);
	}
	return <>{children}</>;
}

