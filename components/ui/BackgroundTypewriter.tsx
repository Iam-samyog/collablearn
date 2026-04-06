'use client';
import { useEffect, useState } from 'react';

export function BackgroundTypewriter() {
	return (
		<div className="absolute top-0 left-0 right-0 h-[100vh] flex flex-col justify-start items-start gap-0 overflow-hidden pointer-events-none -z-10 select-none px-12 pt-24">
			<TypewriterLine phrase="FOCUS" />
			<TypewriterLine phrase="COLLAB" />
			<TypewriterLine phrase="GROW" />
		</div>
	);
}

function TypewriterLine({ phrase }: { phrase: string }) {
	const [text, setText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (!isDeleting) {
				if (text.length < phrase.length) {
					setText(phrase.substring(0, text.length + 1));
				} else {
					setTimeout(() => setIsDeleting(true), 4000);
				}
			} else {
				if (text.length > 0) {
					setText(phrase.substring(0, text.length - 1));
				} else {
					setIsDeleting(false);
				}
			}
		}, isDeleting ? 40 : 150);

		return () => clearTimeout(timeout);
	}, [text, isDeleting, phrase]);

	return (
		<div className="text-[25vw] font-poppins font-black uppercase tracking-tighter whitespace-nowrap text-textMain opacity-[0.03] leading-[0.8] transition-all duration-300">
			{text}
		</div>
	);
}
