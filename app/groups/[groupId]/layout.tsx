'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GroupTopBar } from '@/components/groups/GroupTopBar';
import { useAuth } from '@/components/auth/AuthProvider';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function GroupLayout({ children, params }: { children: React.ReactNode; params: { groupId: string } }) {
	const { groupId } = params;
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const [isOpen, setIsOpen] = useState(true);
	
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
			<div className="absolute top-0 left-0 text-[20vw] font-black text-black/[0.01] select-none pointer-events-none -translate-x-1/4 leading-none">
				HUB
			</div>

			<div className="flex-1 flex flex-col md:flex-row min-h-0 relative z-10 w-full h-full">
				<button 
					onClick={() => setIsOpen(true)}
					className={`fixed top-12 left-12 z-[100] w-14 h-14 bg-neonLime text-deepInk rounded-full flex items-center justify-center shadow-max hover:scale-110 active:scale-95 transition-all duration-500 md:hidden ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
				>
					<Menu className="w-6 h-6" />
				</button>

				<button 
					onClick={() => setIsOpen(true)}
					className={`fixed top-12 left-12 z-[100] w-16 h-16 bg-neonLime text-deepInk rounded-full hidden md:flex items-center justify-center shadow-max hover:scale-110 active:scale-95 transition-all duration-700 ${isOpen ? 'opacity-0 pointer-events-none translate-x-[-100px]' : 'opacity-100 translate-x-0'}`}
				>
					<Menu className="w-7 h-7" />
				</button>

				{/* High-Saturation Neon Sidebar */}
				<aside className={`fixed md:relative top-0 left-0 bottom-0 w-80 flex-shrink-0 p-12 flex flex-col h-full overflow-y-auto border-r border-deepInk/10 bg-neonLime z-[110] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
					<button 
						onClick={() => setIsOpen(false)}
						className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all group"
					>
						<X className="w-5 h-5 text-deepInk group-hover:rotate-90 transition-transform duration-500" />
					</button>

					<div className="mb-20 flex flex-col gap-4 mt-12">
						<Link href="/" className="text-4xl font-poppins font-black tracking-tight text-deepInk">
							Collab Learn.
						</Link>
					</div>
					
					<div className="flex-1 flex flex-col gap-6">
						{links.map((link) => {
							const isActive = pathname === link.href || (link.name !== 'Chat' && pathname?.includes(link.href));
							return (
								<Link 
									key={link.name} 
									href={link.href}
									className={`group flex items-center justify-between px-2 py-4 transition-all duration-300 cursor-pointer ${
										isActive 
											? 'text-deepInk translate-x-4' 
											: 'text-deepInk/40 hover:text-deepInk hover:translate-x-4'
									}`}
								>
									<span className="text-lg font-poppins font-semibold tracking-normal leading-none">{link.name}</span>
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
								<span className="text-sm font-poppins font-semibold text-deepInk truncate max-w-[120px]">
									{user?.displayName || user?.email?.split('@')[0] || 'User'}
								</span>
								<span className="text-xs font-poppins text-deepInk/50">Active now</span>
							</div>
						</div>
						
						<div className="flex flex-col gap-2">
							<Link 
								href="/groups"
								className="text-sm font-poppins font-medium text-deepInk/60 hover:text-deepInk transition-colors"
							>
								Back to Dashboard
							</Link>
							<button 
								onClick={() => logout()}
								className="text-left text-sm font-poppins font-medium text-deepInk/60 hover:text-red-600 transition-colors"
							>
								Terminate Session
							</button>
						</div>
					</div>
				</aside>

				{/* Sidebar Overlay (Mobile Only) */}
				{isOpen && (
					<div 
						className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[105] md:hidden transition-all duration-500"
						onClick={() => setIsOpen(false)}
					/>
				)}

				{/* Main Content Area */}
				<main className={`flex-1 min-w-0 h-full overflow-hidden bg-white transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'md:ml-0' : 'md:-ml-80'}`}>
					{children}
				</main>
			</div>
		</div>
	);
}
