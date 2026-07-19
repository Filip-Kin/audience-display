/**
 * Rainbow Rumble sponsor art with per-logo display hints. Screens that run a
 * sponsor slideshow import this instead of assets.sponsors so light-on-dark
 * logos can opt into a white card behind them.
 */
export type RrSponsor = {
	src: string;
	/** Logo needs a white card behind it to read on the dark background. */
	light?: boolean;
};

export const RR_SPONSORS: RrSponsor[] = [
	{ src: "/rainbow-rumble/rev.png" },
	{ src: "/rainbow-rumble/techsmith-dark.webp" },
	{ src: "/rainbow-rumble/thrifty-dark.webp" },
	{ src: "/rainbow-rumble/mcr.webp" },
	{ src: "/rainbow-rumble/rsa.webp", light: true },
];
