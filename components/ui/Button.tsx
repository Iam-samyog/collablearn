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
	const base = 'inline-flex items-center justify-center font-bold font-poppins uppercase tracking-wider border-[3px] border-borderMain shadow-brutal hover:shadow-brutalHover hover:translate-x-[2px] hover:translate-y-[2px] rounded-none transition-all focus-ring active:shadow-none active:translate-x-[4px] active:translate-y-[4px]';
	
	const variants = {
		primary: 'bg-textMain text-white border-textMain outline-none shadow-brutal',
		secondary: 'bg-white text-textMain',
		accent: 'bg-accentYellow text-textMain',
		ghost: 'border-transparent shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-gray-100 hover:border-transparent active:translate-x-0 active:translate-y-0 text-textMain'
	};
	
	const sizes = {
		sm: 'px-4 py-1.5 text-xs',
		md: 'px-6 py-2.5 text-sm',
		lg: 'px-8 py-4 text-base'
	};
	
	return (
		<button 
			className={cn(base, variants[variant], sizes[size], className)} 
			{...props} 
		/>
	);
}
