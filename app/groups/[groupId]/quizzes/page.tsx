'use client';
import { useEffect, useMemo, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/Button';

type Question = { text: string; options: string[]; correctIndex: number };
type Quiz = { id: string; title: string; questions: Question[] };

export default function QuizzesPage({ params }: { params: { groupId: string } }) {
	const { groupId } = params;
	const { db } = useMemo(() => initFirebase(), []);
	const { user } = useAuth();
	const [quizzes, setQuizzes] = useState<Quiz[]>([]);
	const [title, setTitle] = useState('');
	const [newQ, setNewQ] = useState<Question>({ text: '', options: ['', '', '', ''], correctIndex: 0 });
	const [builderQs, setBuilderQs] = useState<Question[]>([]);
	const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
	const [answers, setAnswers] = useState<number[]>([]);
	const [result, setResult] = useState<number | null>(null);
	const [creatingQuiz, setCreatingQuiz] = useState(false);
	const [submittingQuiz, setSubmittingQuiz] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const unsub = onSnapshot(collection(db, 'groups', groupId, 'quizzes'), (snap) => {
			setQuizzes(snap.docs.map((d) => {
				const data = d.data() as any;
				return { id: d.id, title: data.title, questions: data.questions || [] };
			}));
		});
		return () => unsub();
	}, [db, groupId]);

	async function addQuestion() {
		setError(null);
		if (!newQ.text.trim()) {
			setError('Question text is required');
			return;
		}
		const filledOptions = newQ.options.filter(o => o.trim() !== '');
		if (filledOptions.length < 2) {
			setError('At least 2 options are required');
			return;
		}
		
		// Clean the question data
		const cleanedQ = {
			...newQ,
			options: filledOptions,
		};

		setBuilderQs((prev) => [...prev, cleanedQ]);
		setNewQ({ text: '', options: ['', '', '', ''], correctIndex: 0 });
	}

	async function createQuiz() {
		setError(null);
		if (!user || !title.trim()) {
			setError('Quiz title is required');
			return;
		}

		let finalQs = [...builderQs];
		
		// Auto-add current question if it looks complete
		const filledOptions = newQ.options.filter(o => o.trim() !== '');
		if (newQ.text.trim() && filledOptions.length >= 2) {
			finalQs.push({
				...newQ,
				options: filledOptions
			});
		}

		if (finalQs.length === 0) {
			setError('At least one question is required');
			return;
		}

		setCreatingQuiz(true);
		try {
			await addDoc(collection(db, 'groups', groupId, 'quizzes'), {
				title: title.trim(),
				questions: finalQs,
				ownerId: user.uid,
				createdAt: serverTimestamp()
			});
			setTitle('');
			setBuilderQs([]);
			setNewQ({ text: '', options: ['', '', '', ''], correctIndex: 0 });
		} catch (error) {
			console.error('Error creating quiz:', error);
			alert('Failed to create quiz. Please try again.');
		} finally {
			setCreatingQuiz(false);
		}
	}

	function startQuiz(q: Quiz) {
		setActiveQuiz(q);
		setAnswers(Array(q.questions.length).fill(-1));
		setResult(null);
	}

	async function submit() {
		if (!user || !activeQuiz) return;
		setSubmittingQuiz(true);
		try {
			let score = 0;
			activeQuiz.questions.forEach((q, i) => {
				if (answers[i] === q.correctIndex) score += 1;
			});
			setResult(score);
			await addDoc(collection(db, 'groups', groupId, 'quizzes', activeQuiz.id, 'submissions'), {
				uid: user.uid,
				answers,
				score,
				createdAt: serverTimestamp()
			});
		} catch (error) {
			console.error('Error submitting quiz:', error);
			alert('Failed to submit results. Please try again.');
		} finally {
			setSubmittingQuiz(false);
		}
	}

	return (
		<RequireAuth>
			<div className="flex flex-col h-full w-full bg-white relative overflow-hidden p-12">
				{/* Maximalist Backdrop */}
				<div className="absolute top-0 right-0 text-[35vw] font-black text-black/[0.01] select-none pointer-events-none -translate-y-1/4 translate-x-1/4 leading-none">
					TEST
				</div>

				<div className="relative z-10 flex flex-col h-full max-w-[1400px] mx-auto w-full">
					<div className="mb-16 flex items-center justify-between px-4">
						<h2 className="text-5xl font-black tracking-tighter text-deepInk">
							Group <span className="text-neonLime">Quizzes</span>
						</h2>
						<div className="text-[10px] font-black tracking-[0.5em] text-deepInk/20">
							/ Assessment Suite
						</div>
					</div>

					<div className="grid md:grid-cols-12 gap-12 overflow-y-auto pb-32 pr-4 custom-scrollbar">
						{/* Create Section */}
						<div className="md:col-span-5 flex flex-col gap-8 bg-black/5 p-12 rounded-[3.5rem] h-fit">
							<div className="flex flex-col gap-2">
								<h3 className="text-xs font-black tracking-[0.3em] text-deepInk/40">01. Studio Creator</h3>
								<h4 className="text-3xl font-black tracking-tighter text-deepInk">Create Quiz</h4>
							</div>
							
							<div className="flex flex-col gap-6">
								<input 
									placeholder="QUIZ TITLE..." 
									value={title} 
									onChange={(e) => setTitle(e.target.value)} 
									className="w-full bg-white rounded-full px-8 py-5 text-[10px] font-black tracking-widest border-0 focus-ring shadow-soft" 
								/>
								<div className="flex flex-col gap-4 pt-4 border-t border-black/5">
									<input 
										placeholder="QUESTION TEXT..." 
										value={newQ.text} 
										onChange={(e) => setNewQ({ ...newQ, text: e.target.value })} 
										className="w-full bg-white rounded-full px-8 py-5 text-[10px] font-black tracking-widest border-0 focus-ring shadow-soft" 
									/>
									<div className="grid grid-cols-1 gap-3">
										{new Array(4).fill(0).map((_, idx) => (
											<div key={idx} className="flex items-center group">
												<input
													placeholder={`OPTION 0${idx + 1}`}
													value={newQ.options[idx]}
													onChange={(e) => {
														const opts = [...newQ.options];
														opts[idx] = e.target.value;
														setNewQ({ ...newQ, options: opts });
													}}
													className="flex-1 bg-white rounded-full px-8 py-4 text-[10px] font-black tracking-widest border-0 focus-ring shadow-soft"
												/>
												<button
													onClick={() => setNewQ({ ...newQ, correctIndex: idx })}
													className={`ml-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${newQ.correctIndex === idx ? 'bg-neonLime text-deepInk scale-110 shadow-soft' : 'bg-white/50 text-deepInk/20 hover:bg-white'}`}
												>
													<div className={`w-2 h-2 rounded-full ${newQ.correctIndex === idx ? 'bg-deepInk' : 'bg-deepInk/20'}`}></div>
												</button>
											</div>
										))}
									</div>
									<Button variant="secondary" size="md" className="mt-4" onClick={addQuestion}>Add Question</Button>
								</div>
								
								{error && (
									<div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4">
										<p className="text-[10px] font-black tracking-widest text-red-500 uppercase">{error}</p>
									</div>
								)}
								
								{builderQs.length > 0 && (
									<div className="flex items-center justify-between px-2">
										<span className="text-[8px] font-black tracking-[0.3em] opacity-40">Questions Cached: {builderQs.length}</span>
										<div className="w-1.5 h-1.5 rounded-full bg-neonLime animate-pulse"></div>
									</div>
								)}
								<Button variant="accent" size="lg" className="w-full py-6 mt-4" onClick={createQuiz} disabled={creatingQuiz}>
									{creatingQuiz ? 'Deploying...' : 'Deploy Quiz'}
								</Button>
							</div>
						</div>

						{/* Available Quizzes */}
						<div className="md:col-span-7 flex flex-col gap-10">
							<div className="flex flex-col gap-2">
								<h3 className="text-xs font-black tracking-[0.3em] text-deepInk/40 px-4">02. Live Library</h3>
								<h4 className="text-3xl font-black tracking-tighter text-deepInk px-4">Deployments</h4>
							</div>
							
							<div className="flex flex-col gap-8">
								{quizzes.map((q) => (
									<div key={q.id} className="p-10 bg-white border border-black/5 rounded-[3rem] shadow-soft hover:shadow-max group transition-all duration-700 flex items-center justify-between">
										<div className="flex flex-col gap-2">
											<div className="text-2xl font-black tracking-tighter text-deepInk group-hover:text-neonLime transition-colors">{q.title}</div>
											<div className="text-[10px] font-bold text-deepInk/30 tracking-widest">{q.questions.length} Items Pool</div>
										</div>
										<Button variant="accent" size="md" onClick={() => startQuiz(q)}>Enter Quiz</Button>
									</div>
								))}
								
								{activeQuiz && (
									<div className="p-16 bg-deepInk rounded-[4rem] text-white shadow-max mt-12 relative overflow-hidden transition-all duration-700">
										<div className="absolute top-0 right-0 text-[10vw] font-black text-white/[0.03] select-none pointer-events-none leading-none">QUIZ</div>
										<h3 className="text-4xl font-black tracking-tighter mb-16 relative z-10">{activeQuiz.title}</h3>
										
										<div className="space-y-16 relative z-10">
											{activeQuiz.questions.map((q, i) => (
												<div key={i} className="space-y-8 border-b border-white/5 pb-12 last:border-0">
													<div className="text-xs font-black tracking-[0.5em] text-white/40">Question 0{i + 1}</div>
													<div className="text-2xl font-black tracking-tighter leading-tight italic">{q.text}</div>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														{q.options.map((opt, j) => (
															<label key={j} className={`group cursor-pointer p-6 rounded-full border border-white/10 transition-all duration-300 flex items-center justify-between ${answers[i] === j ? 'bg-neonLime text-deepInk border-neonLime scale-[1.02]' : 'hover:bg-white/5'}`}>
																<input
																	type="radio"
																	name={`q${i}`}
																	checked={answers[i] === j}
																	onChange={() => setAnswers((prev) => {
																		const next = [...prev];
																		next[i] = j;
																		return next;
																	})}
																	className="hidden"
																/>
																<span className="text-[10px] font-black tracking-widest">{opt}</span>
																<div className={`w-3 h-3 rounded-full transition-all ${answers[i] === j ? 'bg-deepInk' : 'bg-white/10 group-hover:bg-white/30'}`}></div>
															</label>
														))}
													</div>
												</div>
											))}
											<div className="flex items-center justify-between pt-8">
												<Button variant="accent" size="lg" className="px-16" onClick={submit} disabled={submittingQuiz}>{submittingQuiz ? 'Submitting...' : 'Commit Results'}</Button>
												{result !== null && (
													<div className="text-right">
														<div className="text-xs font-black tracking-[0.3em] text-white/40 mb-1">Final Score</div>
														<div className="text-5xl font-black italic tracking-tighter text-neonLime leading-none">{result} <span className="text-xl text-white/40 px-2 italic font-black">/ {activeQuiz.questions.length}</span></div>
													</div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</RequireAuth>
	);
}

