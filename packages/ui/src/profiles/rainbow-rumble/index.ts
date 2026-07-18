import type { ProfileDefinition } from "../types";
import MatchPreview from "./screens/match-preview/MatchPreview.svelte";
import MatchReady from "./screens/match-ready/MatchReady.svelte";
import ScoresReady from "./screens/scores-ready/ScoresReady.svelte";
import ScoresReveal from "./screens/score-reveal/ScoresReveal.svelte";
import AllianceSelection from "./screens/alliance-selection/AllianceSelection.svelte";
import Timeout from "./screens/time-out/Timeout.svelte";
import PlayoffBracket from "./screens/playoff-bracket/PlayoffBracket.svelte";
import Rankings from "./screens/rankings/Rankings.svelte";
import "./rr.css";

/**
 * Rainbow Rumble — full-restyle profile. Every screen is overridden with a
 * rainbow-accented variant of the default layout; shared tokens/keyframes live
 * in rr.css (scoped under the .rr class each screen sets on its root).
 */
const profile: ProfileDefinition = {
	id: "rainbow-rumble",
	name: "Rainbow Rumble",
	eventName: "Rainbow Rumble",
	theme: {
		// Same alliance + surface palette as default; the rainbow identity comes
		// from the per-screen accents in rr.css, not the theme tokens.
		primary: "oklch(0.42 0.18 25)",
		secondary: "oklch(0.36 0.20 258)",
		redAlliance: "oklch(0.60 0.235 25)",
		blueAlliance: "oklch(0.53 0.24 258)",
		accentWarn: "oklch(0.88 0.19 92)",
		background: "oklch(0.13 0.012 250)",
		surface: "oklch(0.18 0.014 250)",
		text: "oklch(0.98 0.005 250)",
	},
	assets: {
		event: "/rainbow-rumble/logo.png",
		sponsors: [
			"/rainbow-rumble/rev-dark.webp",
			"/rainbow-rumble/techsmith-dark.webp",
			"/rainbow-rumble/thrifty-dark.webp",
			"/rainbow-rumble/mcr.webp",
			"/rainbow-rumble/rsa.webp",
		],
		livestream: "/rainbow-rumble/fun.webp",
	},
	options: {
		// Alliance names on the match preview sit in a red/blue bar like the
		// default-with-background look, not the design mock's plain text.
		allianceNameBackground: true,
	},
	screens: {
		"match-preview": MatchPreview,
		"match-ready": MatchReady,
		"match-auton": MatchReady,
		"match-transition-shift": MatchReady,
		"match-shift-1": MatchReady,
		"match-shift-2": MatchReady,
		"match-shift-3": MatchReady,
		"match-shift-4": MatchReady,
		"match-endgame": MatchReady,
		"match-end": ScoresReady,
		"scores-ready": ScoresReady,
		"score-reveal": ScoresReveal,
		"alliance-selection": AllianceSelection,
		"alliance-selection-fullscreen": AllianceSelection,
		"playoff-bracket": PlayoffBracket,
		rankings: Rankings,
		timeout: Timeout,
	},
};

export default profile;
