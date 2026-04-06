import Link from 'next/link';
import { ArrowRight, BookOpen, MessageSquare, MonitorPlay, PencilRuler } from 'lucide-react';
import { BackgroundTypewriter } from '@/components/ui/BackgroundTypewriter';

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen relative overflow-hidden z-0">
			<BackgroundTypewriter />
			<main className="flex-1 w-full max-w-[1200px] mx-auto px-4 mt-8">
				{/* Hero Section */}
				<section className="pt-32 pb-16 text-center max-w-[800px] mx-auto">
					<h1 className="text-5xl md:text-7xl font-bold tracking-tight text-textMain mb-6 italic uppercase underline decoration-accentPink decoration-[8px]">
						Your wiki, docs, & projects. Together.
					</h1>
					<h2 className="text-xl md:text-2xl font-medium text-textMain mb-10 text-balance uppercase tracking-tight">
						CollabLearn is the focused workspace where better, faster work happens.
					</h2>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link 
							href="/signup" 
							className="group inline-flex items-center justify-center gap-2 bg-textMain text-white px-10 py-5 border-[3px] border-borderMain shadow-brutal hover:shadow-brutalHover hover:-translate-x-1 hover:-translate-y-1 transition-all rounded-[4px] font-black uppercase tracking-widest w-full sm:w-auto text-lg"
						>
							Get CollabLearn free
							<ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
						</Link>
					</div>
				</section>

				{/* Reviews Section - Promoted to Hero Area */}
				<section className="mb-24 px-4 max-w-[1000px] mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<ReviewCard 
							name="Alex Chen"
							role="CS Student"
							quote="The shared board is leagues ahead."
							color="bg-accentBlue"
						/>
						<ReviewCard 
							name="Sarah Miller"
							role="Med Student"
							quote="Perfect for long study sessions."
							color="bg-accentPink"
						/>
						<ReviewCard 
							name="David Park"
							role="Engineering"
							quote="Exactly what a tool should be."
							color="bg-accentYellow"
						/>
					</div>
				</section>

				{/* Floating UI Image placeholder / Feature graphic */}
				<div className="relative w-full max-w-[1000px] mx-auto mb-24 rounded-xl bg-white border-[3px] border-borderMain shadow-brutal aspect-video flex items-center justify-center overflow-hidden">
					<div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
					<div className="z-10 text-center">
						<BookOpen className="w-16 h-16 text-textMuted mx-auto mb-4" />
						<p className="text-textMain font-black uppercase tracking-widest">Workspace Visual Placeholder</p>
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
			
			<footer className="border-t-[3px] border-borderMain bg-white pt-16 pb-8">
				<div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
					<div className="col-span-1 md:col-span-1">
						<h2 className="text-2xl font-black tracking-tighter mb-4 italic">CollabLearn</h2>
						<p className="text-textMuted text-sm leading-relaxed">
							The focused workspace for groups who build, learn, and grow together.
						</p>
					</div>
					<div>
						<h4 className="font-bold uppercase tracking-wider text-xs mb-6 text-textMuted">Product</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><Link href="#" className="hover:underline">Shared Board</Link></li>
							<li><Link href="#" className="hover:underline">Video Rooms</Link></li>
							<li><Link href="#" className="hover:underline">Real-time Chat</Link></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold uppercase tracking-wider text-xs mb-6 text-textMuted">Company</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><Link href="#" className="hover:underline">About Us</Link></li>
							<li><Link href="#" className="hover:underline">Privacy Policy</Link></li>
							<li><Link href="#" className="hover:underline">Terms of Service</Link></li>
						</ul>
					</div>
					<div>
						<h4 className="font-bold uppercase tracking-wider text-xs mb-6 text-textMuted">Connect</h4>
						<ul className="space-y-4 text-sm font-medium">
							<li><Link href="#" className="hover:underline">Twitter / X</Link></li>
							<li><Link href="#" className="hover:underline">GitHub</Link></li>
							<li><Link href="#" className="hover:underline">Discord</Link></li>
						</ul>
					</div>
				</div>
				<div className="max-w-[1200px] mx-auto px-4 pt-8 border-t border-borderMuted flex flex-col md:row items-center justify-between gap-4">
					<p className="text-sm text-textMuted">© {new Date().getFullYear()} CollabLearn. All rights reserved.</p>
					<div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-[#999]">
						Built for focus.
					</div>
				</div>
			</footer>
		</div>
	);
}

function ReviewCard({ name, role, quote, color }: { name: string, role: string, quote: string, color: string }) {
	return (
		<div className={`p-8 border-[3px] border-borderMain shadow-brutal hover:shadow-brutalHover hover:-translate-x-1 hover:-translate-y-1 transition-all ${color} h-full flex flex-col`}>
			<p className="text-lg font-bold leading-tight mb-6 flex-1 italic">"{quote}"</p>
			<div>
				<h4 className="font-black uppercase tracking-tight text-sm">{name}</h4>
				<p className="text-xs font-bold opacity-70 tracking-wide">{role}</p>
			</div>
		</div>
	);
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
	return (
		<div className="p-8 border-[3px] border-borderMain bg-white shadow-brutal hover:shadow-brutalHover hover:-translate-x-1 hover:-translate-y-1 transition-all cursor-default h-full">
			<div className="mb-6 bg-white w-14 h-14 border-[3px] border-borderMain flex items-center justify-center shadow-brutal group-hover:shadow-none">
				{icon}
			</div>
			<h3 className="font-black text-textMain text-xl mb-3 uppercase tracking-tight">{title}</h3>
			<p className="text-textMuted leading-relaxed font-medium">{description}</p>
		</div>
	);
}
