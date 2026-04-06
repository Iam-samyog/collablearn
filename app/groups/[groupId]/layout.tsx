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
		<div className="bg-gray-200 w-full px-4 py-4 md:px-6 flex flex-col flex-1 h-full">
			<GroupTopBar groupId={groupId} />
			
			<div className="mt-4 flex-1 flex flex-col md:flex-row gap-6 min-h-0">
				{/* Sidebar */}
				<aside className="w-full md:w-64 flex-shrink-0 card bg-accentBlue p-4 flex flex-col h-fit md:h-full overflow-y-auto">
					<div className="mb-6 flex flex-col gap-4">
						<Link href="/" className="text-2xl font-poppins font-bold tracking-tight uppercase">
							<span className="text-textMain">Collab</span>
							<span className="text-white">Learn</span>
						</Link>
					</div>
					
					<div className="flex-1 flex flex-col gap-2">
						<h3 className="font-poppins font-bold text-sm tracking-wider uppercase text-textMain mb-2 px-2">Navigation</h3>
						{links.map((link) => {
							const isActive = pathname === link.href || (link.name !== 'Chat' && pathname?.includes(link.href));
							return (
								<Link 
									key={link.name} 
									href={link.href}
									className={`px-4 py-3 font-poppins font-bold uppercase transition-all ${
										isActive 
											? 'bg-accentYellow border-[3px] border-borderMain shadow-brutal translate-x-[2px] translate-y-[2px]' 
											: 'border-[3px] border-transparent hover:border-borderMain hover:bg-white hover:shadow-brutalHover hover:translate-y-[2px] hover:translate-x-[2px]'
									}`}
								>
									{link.name}
								</Link>
							);
						})}
					</div>

					<div className="mt-8 flex flex-col gap-2 border-t-[3px] border-borderMain pt-4">
						<h3 className="font-poppins font-bold text-sm tracking-wider uppercase text-textMain mb-1 px-2">Account</h3>
						
						<div className="px-4 py-3 font-poppins font-bold uppercase bg-white border-[3px] border-borderMain text-xs truncate">
							{user?.displayName || user?.email || 'User'}
						</div>
						
						<Link 
							href="/groups"
							className="px-4 py-3 font-poppins font-bold uppercase transition-all border-[3px] border-transparent hover:border-borderMain hover:bg-white hover:shadow-brutalHover hover:translate-y-[2px] hover:translate-x-[2px]"
						>
							All Groups
						</Link>
						
						<button 
							onClick={() => logout()}
							className="text-left px-4 py-3 font-poppins font-bold uppercase transition-all border-[3px] border-transparent hover:border-black hover:bg-red-500 hover:text-white hover:shadow-brutalHover hover:translate-y-[2px] hover:translate-x-[2px]"
						>
							Logout
						</button>
					</div>
				</aside>

				{/* Main Content Area */}
				<main className="flex-1 min-w-0 h-full overflow-hidden">
					{children}
				</main>
			</div>
		</div>
	);
}
