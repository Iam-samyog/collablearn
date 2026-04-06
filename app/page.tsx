import Link from 'next/link';
import { ArrowRight, BookOpen, MessageSquare, MonitorPlay, PencilRuler } from 'lucide-react';
import { BackgroundTypewriter } from '@/components/ui/BackgroundTypewriter';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
	return (
		<div className="relative overflow-x-hidden z-0 bg-white min-h-screen">
			<BackgroundTypewriter />
			
			{/* Hero Section - Maximalist Left-Align */}
			<section className="pt-64 pb-32 max-w-[1600px] mx-auto px-12 relative">
				<div className="absolute top-48 left-12 text-sm font-black uppercase tracking-[0.5em] text-neonLime flex items-center gap-4">
					<div className="w-12 h-[2px] bg-neonLime"></div>
					01. The New Standard
				</div>
				<h1 className="text-8xl md:text-[12rem] font-black tracking-tighter text-deepInk mb-12 uppercase leading-[0.85] max-w-[1200px]">
					Work <span className="text-neonLime outline-text">Together</span> <br/>
					Study Faster.
				</h1>
				<p className="text-xl md:text-3xl font-bold text-deepInk/40 mb-16 max-w-[800px] uppercase tracking-tight leading-tight">
					CollabLearn is the high-performance workspace where better, faster work happens. Built for the next generation of builders.
				</p>
				<div className="flex flex-col sm:flex-row items-start justify-start gap-8">
					<Link href="/signup">
						<Button variant="accent" size="lg" className="text-xl px-16 py-8">
							Start Building Free
						</Button>
					</Link>
					<Link href="/groups" className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] py-8">
						Explore the community
						<div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-neonLime group-hover:border-neonLime transition-all">
							<ArrowRight className="w-4 h-4" />
						</div>
					</Link>
				</div>
			</section>

			{/* Reviews Section - Asymmetric Art Gallery */}
			<section className="mt-64 mb-96 px-12 relative max-w-[1800px] mx-auto">
				<div className="flex justify-between items-end mb-24">
					<h2 className="text-7xl font-black uppercase tracking-tighter leading-none">
						Trusted by <br/> <span className="text-neonLime">10,000+</span> Builders
					</h2>
					<div className="text-xs font-black uppercase tracking-[0.4em] text-textMain/20 mb-2">
						/ Testimonials
					</div>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
					<div className="md:col-span-5 md:pt-24">
						<ReviewCard 
							name="Alex Chen"
							role="CS Student"
							quote="The shared board is leagues ahead. We use it for every sprint planning session now. It's minimal, fast, and stays out of the way."
							color="bg-softBlush"
						/>
					</div>
					<div className="md:col-span-7">
						<ReviewCard 
							name="Sarah Miller"
							role="Med Student"
							quote="Perfect for long study sessions. The video quality and audio detection is incredibly helpful. I haven't used another tool since I found CollabLearn."
							color="bg-neonLime"
						/>
					</div>
					<div className="md:col-span-8">
						<ReviewCard 
							name="David Park"
							role="Engineering"
							quote="Exactly what a developer tools should be—minimal, fast, and stays out of the way of work. The focus on speed is evident in every interaction."
							color="bg-deepInk"
							dark
						/>
					</div>
					<div className="md:col-span-4 md:pt-48">
						<div className="p-12 bg-white border border-black/5 rounded-[4rem] shadow-max flex flex-col items-center justify-center text-center group hover:scale-[1.05] transition-transform duration-700">
							<div className="w-16 h-16 rounded-full bg-neonLime mb-6 flex items-center justify-center">
								<ArrowRight className="w-6 h-6" />
							</div>
							<h4 className="font-black uppercase tracking-widest text-xs">Join the Movement</h4>
						</div>
					</div>
				</div>
			</section>

			{/* Feature Grid - Minimalist Spacing */}
			<section className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-96 border-y border-black/5">
				<FeatureCard 
					icon={<MessageSquare className="w-10 h-10" />}
					title="Real-time Chat"
					description="Connect instantly with your study group. Share links, notes, and collaborate effortlessly."
					index="01"
				/>
				<FeatureCard 
					icon={<PencilRuler className="w-10 h-10" />}
					title="Shared Board"
					description="A blank canvas for your big ideas. Draw, write, and map out concepts together."
					index="02"
				/>
				<FeatureCard 
					icon={<MonitorPlay className="w-10 h-10" />}
					title="Video Rooms"
					description="Hop on a quick call to debug, review, or just hang out while pushing through exams."
					index="03"
				/>
			</section>

			<footer className="pt-32 pb-16 relative overflow-hidden bg-white px-12 border-t border-black/5">
				<div className="max-w-[1600px] mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-32">
						<Link href="/" className="text-6xl font-black uppercase tracking-tighter hover:text-neonLime transition-colors">
							COLLABLERN.
						</Link>
						<nav className="flex flex-wrap gap-x-16 gap-y-8">
							<Link href="#" className="text-xs font-black uppercase tracking-[0.3em] hover:text-neonLime">Board</Link>
							<Link href="#" className="text-xs font-black uppercase tracking-[0.3em] hover:text-neonLime">Video</Link>
							<Link href="#" className="text-xs font-black uppercase tracking-[0.3em] hover:text-neonLime">Chat</Link>
							<Link href="#" className="text-xs font-black uppercase tracking-[0.3em] hover:text-neonLime">Docs</Link>
						</nav>
					</div>
					
					<div className="pt-16 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-8">
						<div className="flex flex-col gap-2">
							<p className="text-[10px] font-black text-textMain/40 uppercase tracking-[0.2em]">© {new Date().getFullYear()} CollabLearn. High-Performance Study.</p>
						</div>
						<div className="flex items-center gap-12">
							<Link href="#" className="text-[10px] font-black text-textMain/40 uppercase tracking-widest hover:text-black">Privacy</Link>
							<Link href="#" className="text-[10px] font-black text-textMain/40 uppercase tracking-widest hover:text-black">Terms</Link>
							<div className="text-[10px] font-black uppercase tracking-[0.5em] text-neonLime">
								BUILD_v1.0
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

function ReviewCard({ name, role, quote, color, dark = false }: { name: string, role: string, quote: string, color: string, dark?: boolean }) {
	return (
		<div className={`p-16 rounded-[4rem] transition-all duration-700 ${color} ${dark ? 'text-white' : 'text-deepInk'} shadow-soft hover:shadow-max group cursor-default h-full flex flex-col justify-between`}>
			<div>
				<div className={`text-6xl font-black mb-12 opacity-20 ${dark ? 'text-white' : 'text-black'}`}>“</div>
				<p className="text-3xl font-black leading-[1.1] mb-16 tracking-tighter uppercase italic">{quote}</p>
			</div>
			<div className="pt-8 border-t border-current/10">
				<h4 className="font-black uppercase tracking-widest text-sm mb-2">{name}</h4>
				<p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{role}</p>
			</div>
		</div>
	);
}

function FeatureCard({ icon, title, description, index }: { icon: React.ReactNode, title: string, description: string, index: string }) {
	return (
		<div className="p-20 bg-white group hover:bg-neonLime transition-all duration-700 cursor-default border-r border-black/5 last:border-r-0">
			<div className="flex justify-between items-start mb-24">
				<div className="w-20 h-20 rounded-[2rem] bg-black/5 flex items-center justify-center group-hover:bg-black transition-all">
					<div className="group-hover:text-neonLime transition-colors">
						{icon}
					</div>
				</div>
				<div className="text-xs font-black tracking-[0.5em] text-black/10 group-hover:text-black transition-colors">
					{index}
				</div>
			</div>
			<h3 className="font-black text-textMain text-4xl mb-6 uppercase tracking-tighter leading-none">{title}</h3>
			<p className="text-textMain/60 leading-relaxed font-bold uppercase text-xs tracking-widest group-hover:text-black transition-colors">{description}</p>
		</div>
	);
}
