import type { ProfileAssets, SponsorLogo } from "lib";

/** A slideshow deck entry: sponsor art, or the live mini playoff bracket. */
export type SponsorSlide = { kind: "sponsor"; sponsor?: SponsorLogo } | { kind: "bracket" };

/**
 * Sponsors for the results-screen carousel. The livestream partner already has
 * its dedicated spot on that screen, so its logo sits out of the rotation.
 */
export function resultsSponsors(assets: ProfileAssets): SponsorLogo[] {
	return assets.sponsors.filter((s) => s.src !== assets.livestream);
}

/**
 * Slideshow deck for the chrome screens: every sponsor, plus one bracket page
 * (mid-deck) when the event is in playoffs.
 */
export function sponsorDeck(sponsors: SponsorLogo[], includeBracket: boolean): SponsorSlide[] {
	const deck: SponsorSlide[] = sponsors.map((sponsor) => ({ kind: "sponsor" as const, sponsor }));
	if (includeBracket) deck.splice(Math.min(2, deck.length), 0, { kind: "bracket" });
	return deck;
}
