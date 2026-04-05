import Link from 'next/link';

export default function HomePage() {
	return (
		<div className="max-w-6xl mx-auto px-4">
			<section className="py-16 md:py-24">
				<div className="grid md:grid-cols-2 items-center gap-10">
					<div>
						<h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
							Minimal, AI‑powered learning built for focus
						</h1>
						<p className="mt-4 text-muted max-w-prose">
							Study groups, real-time chat, collaborative whiteboard, video calls, quizzes,
							and a shared music player — all in one distraction‑free workspace.
						</p>
						<div className="mt-6 flex items-center gap-3">
							<Link href="/signup" className="primary px-4 py-2 rounded-md">Get started</Link>
							<Link href="/groups" className="px-4 py-2 border border-white/10 rounded-md hover:bg-white/5 transition">
								Explore groups
							</Link>
						</div>
					</div>
					<div className="card p-6">
						<div className="grid grid-cols-3 gap-3 text-sm text-muted">
							<div className="p-4 rounded-lg bg-white/5">
								<div className="text-white font-medium">Groups</div>
								Create or join focused study spaces.
							</div>
							<div className="p-4 rounded-lg bg-white/5">
								<div className="text-white font-medium">Chat</div>
								Real‑time messaging.
							</div>
							<div className="p-4 rounded-lg bg-white/5">
								<div className="text-white font-medium">Board</div>
								Collaborative notes & drawings.
							</div>
							<div className="p-4 rounded-lg bg-white/5">
								<div className="text-white font-medium">Video</div>
								Group calls up to 10.
							</div>
							<div className="p-4 rounded-lg bg-white/5">
								<div className="text-white font-medium">Quizzes</div>
								Build and assess quickly.
							</div>
							<div className="p-4 rounded-lg bg-white/5">
								<div className="text-white font-medium">Music</div>
								Shared focus playlists.
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

