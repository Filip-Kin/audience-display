import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * WRC profile — Wolverine Robotics Competition.
 *
 * Ships its own event branding + custom victory animations, and reuses the
 * default profile's screen layouts for everything else.
 *
 * Per-screen overrides: add a component here keyed by its Screen id and it
 * wins; any screen NOT listed falls back to the default profile via
 * resolveScreen(). To override e.g. the scores-ready screen, create
 * `./screens/scores-ready/ScoresReady.svelte` and wire it:
 *   import WrcScoresReady from "./screens/scores-ready/ScoresReady.svelte";
 *   screens: { "scores-ready": WrcScoresReady },
 *
 * `eventName` overrides the event title shown on-screen (otherwise the live
 * FMS event name is used).
 */
const profile: ProfileDefinition = {
  id: "wrc",
  name: "WRC (Wolverine Robotics Competition)",
  eventName: "Wolverine Robotics Competition",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves read from primary/secondary. WRC uses two navy-blue tones
    // (a navy + a slightly lighter navy) instead of the default red/blue.
    // Alliance score boxes still use redAlliance/blueAlliance below.
    primary: "oklch(0.44 0.12 259)", // lighter, vibrant navy-blue
    secondary: "oklch(0.31 0.11 259)", // deeper navy-blue
  },
  assets: {
    event: "/wrc.png", // center logo on the score-reveal screen
    sponsors: ["/sponsor2.png"], // top-left "Event Sponsors" slot
    livestream: "/pitpodcast.png",
  },
  animations: {
    victoryRed: "/animations/wrc/redwins.mp4",
    victoryBlue: "/animations/wrc/bluewins.mp4",
    victoryTie: "/animations/wrc/tie.mp4",
  },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
