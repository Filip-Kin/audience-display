/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,svelte}"],
	theme: {
		extend: {
			gridTemplateColumns: {
				realtimeScores: "1fr auto 1fr",
			},
			colors: {
				primary: {
					50: "#dceeff",
					100: "#b2deff",
					200: "#6dc4ff",
					300: "#20a6ff",
					400: "#008bff",
					500: "#006cdf",
					600: "#0055b4",
					700: "#004994",
					800: "#003368",
					900: "#002551",
				},
				secondary: {
					100: "#fefce8",
					200: "#fffac2",
					300: "#fff187",
					400: "#ffe243",
					500: "#ffcb05",
					600: "#efb403",
					700: "#ce8b00",
					800: "#a46204",
					900: "#884c0b",
				},
			},
		},
	},
	plugins: [],
	safelist: ["bg-gradient-to-r", "bg-gradient-to-l", "rounded-l-xl", "rounded-r-xl"],
};
