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
					50: "#FFF0F0",
					100: "#FFDDDD",
					200: "#FFBFBF",
					300: "#FF9A9A",
					400: "#FF7070",
					500: "#FF3D3D",
					600: "#E60000",
					700: "#BC0000",
					800: "#960000",
					900: "#550000",
					950: "#3A0000",
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
