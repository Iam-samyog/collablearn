import type { Config } from 'tailwindcss';

const config: Config = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./lib/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				bg: '#0B0F14',
				surface: '#0F141B',
				muted: '#7A8CA0',
				accent: '#67E8F9',
				accentMuted: '#164E63'
			},
			boxShadow: {
				soft: '0 4px 24px rgba(0,0,0,0.2)'
			}
		}
	},
	plugins: []
};

export default config;

