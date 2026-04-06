'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GroupTopBar } from '@/components/groups/GroupTopBar';
import { useAuth } from '@/components/auth/AuthProvider';

export default function GroupLayout({ children, params }: { children: React.ReactNode; params: { groupId: string } }) {
	const { groupId } = params;
	const pathname = usePathname();
	const { user, logout } = useAuth();
	
	const links = [
		{ name: 'Chat', href: `/groups/${groupId}` },
		{ name: 'Board', href: `/groups/${groupId}/board` },
		{ name: 'Video', href: `/groups/${groupId}/video` },
		{ name: 'Quizzes', href: `/groups/${groupId}/quizzes` },
		{ name: 'Music', href: `/groups/${groupId}/music` },
	];

	return (
		<div className="bg-white w-full flex flex-col flex-1 h-full min-h-screen relative overflow-hidden">
			{/* Decorative Backdrop */}
			<div className="absolute top-0 left-0 text-[20vw] font-black uppercase text-black/[0.01] select-none pointer-events-none -translate-x-1/4 leading-none">
				HUB
			</div>

			<div className="flex-1 flex flex-col md:flex-row min-h-0 relative z-10">
				{/* High-Saturation Neon Sidebar */}
				<aside className="w-full md:w-80 flex-shrink-0 p-12 flex flex-col h-fit md:h-full overflow-y-auto border-r border-deepInk/10 bg-neonLime">
					<div className="mb-20 flex flex-col gap-4">
						<Link href="/" className="text-4xl font-poppins font-black uppercase tracking-tighter text-deepInk">
							COLLABLEARN.
						</Link>
					</div>
					
					<div className="flex-1 flex flex-col gap-6">
						{links.map((link) => {
							const isActive = pathname === link.href || (link.name !== 'Chat' && pathname?.includes(link.href));
							return (
								<Link 
									key={link.name} 
									href={link.href}
									className={`group flex items-center justify-between px-2 py-4 transition-all duration-300 ${
										isActive 
											? 'text-deepInk translate-x-4' 
											: 'text-deepInk/40 hover:text-deepInk hover:translate-x-4'
									}`}
								>
									<span className="text-lg font-poppins font-black uppercase tracking-[0.1em] leading-none">{link.name}</span>
									<div className={`w-3 h-3 rounded-full transition-all duration-500 ${isActive ? 'bg-deepInk scale-150' : 'bg-transparent group-hover:bg-deepInk/30'}`}></div>
								</Link>
							);
						})}
					</div>

					<div className="mt-20 flex flex-col gap-8 border-t border-deepInk/10 pt-12">
						<div className="flex items-center gap-4 group">
							<div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-poppins font-black text-xs text-deepInk shadow-soft">
								{user?.displayName?.[0] || user?.email?.[0] || 'U'}
							</div>
							<div className="flex flex-col">
								<span className="text-[10px] font-poppins font-black uppercase tracking-widest text-deepInk truncate max-w-[120px]">
									{user?.displayName || user?.email?.split('@')[0] || 'User'}
								</span>
								<span className="text-[8px] font-poppins font-bold text-deepInk/40 uppercase tracking-widest">Active Now</span>
							</div>
						</div>
						
						<div className="flex flex-col gap-2">
							<Link 
								href="/groups"
								className="text-[10px] font-poppins font-black uppercase tracking-[0.2em] text-deepInk/60 hover:text-deepInk transition-colors"
							>
								Back to Dashboard
							</Link>
							<button 
								onClick={() => logout()}
								className="text-left text-[10px] font-poppins font-black uppercase tracking-[0.2em] text-deepInk/60 hover:text-red-600 transition-colors"
							>
								Terminate Session
							</button>
						</div>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 min-w-0 h-full overflow-hidden bg-white">
					{children}
				</main>
			</div>
		</div>
	);
}
