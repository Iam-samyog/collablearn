'use client';
import { useEffect, useState } from 'react';

const phrases = ['Study well.', 'Study with friends.'];

export function BackgroundTypewriter() {
	const [text, setText] = useState('');
	const [phraseIndex, setPhraseIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const currentPhrase = phrases[phraseIndex];
		const timeout = setTimeout(() => {
			if (!isDeleting) {
				if (text.length < currentPhrase.length) {
					setText(currentPhrase.substring(0, text.length + 1));
				} else {
					setTimeout(() => setIsDeleting(true), 2500);
				}
			} else {
				if (text.length > 0) {
					setText(currentPhrase.substring(0, text.length - 1));
				} else {
					setIsDeleting(false);
					setPhraseIndex((prev) => (prev + 1) % phrases.length);
				}
			}
		}, isDeleting ? 40 : 100);

		return () => clearTimeout(timeout);
	}, [text, isDeleting, phraseIndex]);

	return (
		<div className="absolute top-0 left-0 right-0 h-[70vh] flex items-center justify-center overflow-hidden pointer-events-none -z-10 select-none pb-20">
			<div className="text-[14vw] font-poppins font-black uppercase tracking-tighter whitespace-nowrap text-textMain opacity-[0.03] leading-none text-center transition-all duration-300">
				{text}
				<span className="animate-pulse">_</span>
			</div>
		</div>
	);
}
