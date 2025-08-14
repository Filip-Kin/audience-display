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
					50: "#F9F5FD",
					100: "#F2EBFC",
					200: "#E8DAF9",
					300: "#DCC6F6",
					400: "#D2B5F3",
					500: "#C7A0F0",
					600: "#BE8DED",
					700: "#A34CE2",
					800: "#6F2A9E",
					900: "#3E145B",
					950: "#250939",
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
