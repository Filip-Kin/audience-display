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
					50: "#E5F3FF",
					100: "#C7E4FF",
					200: "#94CBFF",
					300: "#5CB0FF",
					400: "#2495FF",
					500: "#007CF0",
					600: "#005FB8",
					700: "#004585",
					800: "#00274C",
					900: "#001224",
					950: "#000B14",
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
	safelist: ["bg-gradient-to-r", "bg-gradient-to-l", "rounded-l-xl", "rounded-r-xl", "grid-rows-4", "grid-rows-5", "grid-rows-6"],
};
