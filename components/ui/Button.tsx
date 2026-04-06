'use client';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';

// Utility for merging tailwind classes safely
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
	const base = 'inline-flex items-center justify-center font-black font-poppins tracking-widest border border-black/5 shadow-soft hover:shadow-max hover:scale-[1.02] active:scale-[0.98] rounded-full transition-all duration-300 focus-ring';
	
	const variants = {
		primary: 'bg-deepInk text-white border-transparent',
		secondary: 'bg-white text-deepInk border-black/5',
		accent: 'bg-neonLime text-deepInk border-transparent',
		ghost: 'border-transparent shadow-none hover:shadow-none hover:bg-black/5 active:translate-x-0 active:translate-y-0 text-textMain'
	};
	
	const sizes = {
		sm: 'px-6 py-2 text-[10px]',
		md: 'px-8 py-3 text-xs',
		lg: 'px-12 py-4 text-base'
	};
	
	return (
		<button 
			className={cn(base, variants[variant], sizes[size], className)} 
			{...props} 
		/>
	);
}
