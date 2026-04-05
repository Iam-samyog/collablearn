'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

export default function SignupPage() {
	const { signup } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await signup(email, password, name);
			router.push('/groups');
		} catch (err: any) {
			setError(err?.message ?? 'Failed to sign up');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="max-w-md mx-auto px-4 py-12">
			<h1 className="text-2xl font-semibold">Create your account</h1>
			<p className="text-muted mt-1">Join groups and start learning</p>
			<form onSubmit={onSubmit} className="mt-6 space-y-3">
				<input
					type="text"
					required
					placeholder="Display name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="w-full"
				/>
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
					{loading ? 'Creating…' : 'Create account'}
				</button>
			</form>
			<p className="text-sm text-muted mt-4">
				Already have an account? <Link href="/login">Sign in</Link>
			</p>
		</div>
	);
}

