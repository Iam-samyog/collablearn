'use client';
import { useEffect, useMemo, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';

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
		if (!newQ.text.trim() || newQ.options.some((o) => !o.trim())) return;
		setBuilderQs((prev) => [...prev, newQ]);
		setNewQ({ text: '', options: ['', '', '', ''], correctIndex: 0 });
	}

	async function createQuiz() {
		if (!user || !title.trim() || builderQs.length === 0) return;
		await addDoc(collection(db, 'groups', groupId, 'quizzes'), {
			title: title.trim(),
			questions: builderQs,
			ownerId: user.uid,
			createdAt: serverTimestamp()
		});
		setTitle('');
		setBuilderQs([]);
	}

	function startQuiz(q: Quiz) {
		setActiveQuiz(q);
		setAnswers(Array(q.questions.length).fill(-1));
		setResult(null);
	}

	async function submit() {
		if (!user || !activeQuiz) return;
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
	}

	return (
		<RequireAuth>
		<div className="grid md:grid-cols-3 gap-6">
			<div className="card p-4 space-y-3">
				<h2 className="font-medium">Create Quiz</h2>
				<input placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
				<div className="space-y-2">
					<input placeholder="Question text" value={newQ.text} onChange={(e) => setNewQ({ ...newQ, text: e.target.value })} className="w-full" />
					{new Array(4).fill(0).map((_, idx) => (
						<div key={idx} className="flex items-center gap-2">
							<input
								placeholder={`Option ${idx + 1}`}
								value={newQ.options[idx]}
								onChange={(e) => {
									const opts = [...newQ.options];
									opts[idx] = e.target.value;
									setNewQ({ ...newQ, options: opts });
								}}
								className="w-full"
							/>
							<label className="text-xs text-muted flex items-center gap-1">
								<input
									type="radio"
									name="correct"
									checked={newQ.correctIndex === idx}
									onChange={() => setNewQ({ ...newQ, correctIndex: idx })}
								/>
								Correct
							</label>
						</div>
					))}
					<button className="px-3 py-2 border border-white/10 rounded-md hover:bg-white/5" onClick={addQuestion}>Add question</button>
				</div>
				{builderQs.length > 0 && (
					<div className="text-sm text-muted">Questions: {builderQs.length}</div>
				)}
				<button className="primary w-full py-2 rounded-md" onClick={createQuiz} disabled={builderQs.length === 0}>Create quiz</button>
			</div>
			<div className="md:col-span-2 space-y-4">
				<h2 className="font-medium">Available Quizzes</h2>
				{quizzes.map((q) => (
					<div key={q.id} className="card p-4 flex items-center justify-between">
						<div>
							<div className="font-medium">{q.title}</div>
							<div className="text-xs text-muted">{q.questions.length} questions</div>
						</div>
						<button className="primary px-3 py-2 rounded-md" onClick={() => startQuiz(q)}>Start</button>
					</div>
				))}
				{activeQuiz && (
					<div className="card p-4">
						<h3 className="font-medium">{activeQuiz.title}</h3>
						<div className="mt-3 space-y-4">
							{activeQuiz.questions.map((q, i) => (
								<div key={i} className="space-y-2">
									<div className="text-sm">{i + 1}. {q.text}</div>
									<div className="grid grid-cols-2 gap-2">
										{q.options.map((opt, j) => (
											<label key={j} className={`px-3 py-2 rounded-md border border-white/10 cursor-pointer ${answers[i] === j ? 'bg-accent text-bg' : 'hover:bg-white/5'}`}>
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
												{opt}
											</label>
										))}
									</div>
								</div>
							))}
							<button className="primary px-4 py-2 rounded-md" onClick={submit}>Submit</button>
							{result !== null && (
								<div className="text-sm text-muted">Score: {result}/{activeQuiz.questions.length}</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
		</RequireAuth>
	);
}

