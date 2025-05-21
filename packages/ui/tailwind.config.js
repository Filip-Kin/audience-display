/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,svelte}"],
	theme: {
		extend: {
			gridTemplateColumns: {
				realtimeScores: "1fr auto 1fr",
			},
		},
	},
	plugins: [],
	safelist: ["bg-gradient-to-r", "bg-gradient-to-l"],
};
