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
					50: "#F0FBFD",
					100: "#E8FAFD",
					200: "#CFF5FA",
					300: "#B3F0F8",
					400: "#93EBF6",
					500: "#79E4F1",
					600: "#73DAE6",
					700: "#529FA7",
					800: "#34686F",
					900: "#173538",
					950: "#0B1E21",
				},
			},
		},
	},
	plugins: [],
	safelist: [
		"bg-gradient-to-r",
		"bg-gradient-to-l",
		"rounded-l-xl",
		"rounded-r-xl",
		"grid-rows-4",
		"grid-rows-5",
		"grid-rows-6",
		"bg-red-800",
		"bg-blue-800",
	],
};
