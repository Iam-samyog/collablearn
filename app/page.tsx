import Link from 'next/link';
import { ArrowRight, BookOpen, MessageSquare, MonitorPlay, PencilRuler } from 'lucide-react';

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Notion-style minimal Navbar */}
			<header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-borderMuted">
				<div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
					<div className="flex items-center gap-2 font-semibold">
						<BookOpen className="w-5 h-5" />
						<span>CollabLearn</span>
					</div>
					<nav className="flex items-center gap-4 text-sm font-medium">
						<Link href="/login" className="text-textMuted hover:text-textMain transition">
							Log in
						</Link>
						<Link href="/signup" className="primary px-3 py-1.5 rounded-[4px] bg-textMain text-white hover:bg-[#202020] transition">
							Get CollabLearn free
						</Link>
					</nav>
				</div>
			</header>

			<main className="flex-1 w-full max-w-[1200px] mx-auto px-4">
				{/* Hero Section */}
				<section className="pt-32 pb-24 text-center max-w-[800px] mx-auto">
					<h1 className="text-5xl md:text-7xl font-bold tracking-tight text-textMain mb-6">
						Your wiki, docs, & projects. Together.
					</h1>
					<h2 className="text-xl md:text-2xl font-medium text-textMain mb-10 text-balance">
						CollabLearn is the connected workspace where better, faster work happens. Now with AI.
					</h2>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link 
							href="/signup" 
							className="group inline-flex items-center justify-center gap-2 bg-textMain text-white px-6 py-3 rounded-[4px] font-medium hover:bg-[#202020] transition w-full sm:w-auto text-lg"
						>
							Get CollabLearn free
							<ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
						</Link>
						<p className="text-textMuted text-sm mt-3 sm:mt-0 sm:absolute sm:translate-y-12">
							For teams of all sizes.
						</p>
					</div>
				</section>

				{/* Floating UI Image placeholder / Feature graphic */}
				<div className="relative w-full max-w-[1000px] mx-auto mb-32 rounded-xl bg-surface border border-borderMuted shadow-floating aspect-video flex items-center justify-center overflow-hidden">
					<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
					<div className="z-10 text-center">
						<BookOpen className="w-16 h-16 text-textMuted mx-auto mb-4" />
						<p className="text-textMuted font-medium">Workspace Visual Placeholder</p>
					</div>
				</div>

				{/* Feature Grid - Notion style */}
				<section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
					<FeatureCard 
						icon={<MessageSquare className="w-6 h-6 text-blue-500" />}
						title="Real-time Chat"
						description="Connect instantly with your study group. Share links, notes, and collaborate effortlessly."
					/>
					<FeatureCard 
						icon={<PencilRuler className="w-6 h-6 text-orange-500" />}
						title="Shared Board"
						description="A blank canvas for your big ideas. Draw, write, and map out concepts together."
					/>
					<FeatureCard 
						icon={<MonitorPlay className="w-6 h-6 text-green-500" />}
						title="Video Study Rooms"
						description="Hop on a quick call to debug, review, or just hang out while pushing through exams."
					/>
				</section>
			</main>
			
			<footer className="border-t border-borderMuted py-8 text-center text-sm text-textMuted">
				<p>© {new Date().getFullYear()} CollabLearn. Built for focus.</p>
			</footer>
		</div>
	);
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
	return (
		<div className="p-6 rounded-[8px] border border-borderMuted/50 bg-surface/50 hover:bg-surface transition cursor-default">
			<div className="mb-4 bg-white w-12 h-12 rounded border border-borderMuted flex items-center justify-center shadow-sm">
				{icon}
			</div>
			<h3 className="font-bold text-textMain text-lg mb-2">{title}</h3>
			<p className="text-textMuted leading-relaxed">{description}</p>
		</div>
	);
}
