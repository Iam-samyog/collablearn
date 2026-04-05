'use client';
import clsx from 'clsx';
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'primary' | 'outline' | 'ghost';
	size?: 'sm' | 'md';
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
	const base = 'rounded-md transition focus-ring';
	const variants = {
		primary: 'bg-accent text-bg hover:bg-cyan-300',
		outline: 'border border-white/10 hover:bg-white/5',
		ghost: 'hover:bg-white/5'
	};
	const sizes = {
		sm: 'px-2 py-1 text-sm',
		md: 'px-3 py-2'
	};
	return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}

