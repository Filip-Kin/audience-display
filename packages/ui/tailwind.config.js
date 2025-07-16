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
					50: "#F9E9FD",
					100: "#F3D2FB",
					200: "#E9A6F8",
					300: "#DF71F4",
					400: "#D135E9",
					500: "#A227B5",
					600: "#771A85",
					700: "#5D1269",
					800: "#430A4B",
					900: "#2C0533",
					950: "#1E0222",
				},
				secondary: {
					50: "#FFFBEB",
					100: "#FFF7D6",
					200: "#FFEFAD",
					300: "#FFE785",
					400: "#FFDD57",
					500: "#FFD52E",
					600: "#FFCB05",
					700: "#C29B00",
					800: "#856A00",
					900: "#423500",
					950: "#1F1800",
				},
			},
		},
	},
	plugins: [],
	safelist: ["bg-gradient-to-r", "bg-gradient-to-l", "rounded-l-xl", "rounded-r-xl"],
};
