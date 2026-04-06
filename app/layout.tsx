import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { UserMenu } from '@/components/layout/UserMenu';
import { Poppins, Roboto } from 'next/font/google';

const poppins = Poppins({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
	variable: '--font-poppins',
});

const roboto = Roboto({
	subsets: ['latin'],
	weight: ['400', '500', '700'],
	variable: '--font-roboto',
});

import { GlobalNavbar } from '@/components/layout/GlobalNavbar';

export const metadata: Metadata = {
	title: 'Collablearn',
	description: 'Minimal, AI-powered online learning platform'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${poppins.variable} ${roboto.variable}`}>
			<body className="font-roboto tracking-wide bg-bg text-textMain min-h-dvh flex flex-col">
				<AuthProvider>
					<div className="min-h-dvh flex flex-col">
						<GlobalNavbar />
						<main className="flex-1 w-full h-full flex flex-col">
							{children}
						</main>
					</div>
				</AuthProvider>
			</body>
		</html>
	);
}

