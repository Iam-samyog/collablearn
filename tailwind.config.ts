import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./lib/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			fontFamily: {
				poppins: ['var(--font-poppins)', 'sans-serif'],
				roboto: ['var(--font-roboto)', 'sans-serif'],
				sans: ['var(--font-roboto)', 'sans-serif'],
			},
			fontSize: {
				'10xl': '9rem',
				'12xl': '12rem',
				'15xl': '15rem',
			},
			colors: {
				bg: '#FFFFFF',
				surface: '#FDFDFA',
				textMain: '#1A1A1A',
				borderMain: '#1A1A1A',
				accentYellow: '#FFE347',
				accentBlue: '#47E1FF',
				accentPink: '#FF88DD',
				accentGreen: '#A0FFA0',
				neonLime: '#C1FF72',
				deepInk: '#1A1A1A',
				softBlush: '#FFEDF2',
			},
			boxShadow: {
				brutal: '4px 4px 0px 0px rgba(26,26,26,1)',
				brutalHover: '2px 2px 0px 0px rgba(26,26,26,1)',
				soft: '0 10px 40px -15px rgba(0,0,0,0.1)',
				max: '0 20px 80px -20px rgba(0,0,0,0.2)',
			}
		}
	},
	plugins: []
};

export default config;
