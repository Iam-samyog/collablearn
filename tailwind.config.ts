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
			colors: {
				bg: '#FDFDFA',
				surface: '#FFFFFF',
				textMain: '#000000',
				borderMain: '#000000',
				accentYellow: '#FFE347',
				accentBlue: '#47E1FF',
				accentPink: '#FF88DD',
				accentGreen: '#A0FFA0',
			},
			boxShadow: {
				brutal: '4px 4px 0px 0px rgba(0,0,0,1)',
				brutalHover: '2px 2px 0px 0px rgba(0,0,0,1)',
			}
		}
	},
	plugins: []
};

export default config;
