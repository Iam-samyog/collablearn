'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

export default function LoginPage() {
	const { login } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login(email, password);
			router.push('/groups');
		} catch (err: any) {
			setError(err?.message ?? 'Failed to sign in');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-md mx-auto px-4 py-12">
			<h1 className="text-2xl font-semibold">Welcome back</h1>
			<p className="text-muted mt-1">Sign in to continue</p>
			<form onSubmit={onSubmit} className="mt-6 space-y-3">
				<input
					type="email"
					required
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full"
				/>
				<input
					type="password"
					required
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full"
				/>
				{error && <div className="text-red-400 text-sm">{error}</div>}
				<button className="primary w-full py-2 rounded-md" disabled={loading}>
					{loading ? 'Signing in…' : 'Sign in'}
				</button>
			</form>
			<p className="text-sm text-muted mt-4">
				No account? <Link href="/signup">Create one</Link>
			</p>
		</div>
	);
}

