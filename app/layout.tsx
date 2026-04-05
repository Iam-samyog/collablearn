import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { UserMenu } from '@/components/layout/UserMenu';

export const metadata: Metadata = {
	title: 'Collablearn',
	description: 'Minimal, AI-powered online learning platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<AuthProvider>
					<div className="min-h-dvh flex flex-col">
						<header className="border-b border-white/5 sticky top-0 z-40 bg-bg/70 backdrop-blur-xl">
							<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
								<Link href="/" className="text-xl font-semibold tracking-tight">
									<span className="text-white">Collab</span>
									<span className="text-accent">Learn</span>
								</Link>
								<nav className="flex items-center gap-3 text-sm">
									<Link href="/groups" className="hover:opacity-80">Groups</Link>
									<UserMenu />
								</nav>
							</div>
						</header>
						<main className="flex-1">
							{children}
						</main>
						<footer className="border-t border-white/5">
							<div className="max-w-6xl mx-auto px-4 py-6 text-xs text-muted">
								Built with Next.js, Tailwind, and Firebase
							</div>
						</footer>
					</div>
				</AuthProvider>
			</body>
		</html>
	);
}

