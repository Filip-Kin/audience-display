/**
 * Rainbow Rumble sponsor art with per-logo display hints. Screens that run a
 * sponsor slideshow import this instead of assets.sponsors so light-on-dark
 * logos can opt into a white card behind them.
 */
export type RrSponsor = {
	src: string;
	/** Logo needs a white card behind it to read on the dark background. */
	light?: boolean;
	/** Skip in the score-results carousel (FUN has its own dedicated spot there). */
	omitOnResults?: boolean;
};

export const RR_SPONSORS: RrSponsor[] = [
	{ src: "/rainbow-rumble/ctre.png" },
	{ src: "/rainbow-rumble/fun.webp", omitOnResults: true },
	{ src: "/rainbow-rumble/rsa.webp", light: true },
	{ src: "/rainbow-rumble/mcr.webp" },
	{ src: "/rainbow-rumble/rev.png" },
	{ src: "/rainbow-rumble/thrifty-dark.webp" },
	// TechSmith + Jeanette Cona-Larock share a stacked slide (smaller sponsors).
	{ src: "/rainbow-rumble/techsmith-jeanette.png" },
];
