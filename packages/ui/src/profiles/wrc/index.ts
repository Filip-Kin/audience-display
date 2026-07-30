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
    // Sponsors in Filip's importance order. famnm ships a light (gray) logo that
    // reads on the dark background bare; the rest are dark/ink logos so they get
    // a white card (light: true) to read on navy/black.
    sponsors: [
      { src: "/famnm.png" },
      // coe + ceo are self-contained navy tiles (their own background), so they
      // read on the dark display without the white card (light omitted).
      { src: "/coe.png" },
      { src: "/csg.png", light: true },
      { src: "/ceo.png" },
      { src: "/adgpe.png", light: true },
    ],
    livestream: "/pitpodcast.png",
    // Event-feedback QR: full-screen sponsor pages (breaks/timeout) only.
    feedbackQr: { src: "/event-feedback-qr.png", label: "Event Feedback" },
  },
  animations: {
    victoryRed: "/animations/wrc/redwins.mp4",
    victoryBlue: "/animations/wrc/bluewins.mp4",
    victoryTie: "/animations/wrc/tie.mp4",
    // First frame of the WRC victory videos; covers the buffering gap.
    cover: "/animations/wrc/first-frame.png",
  },
  options: {
    // WRC-only: put the alliance names on red/blue bars in match preview. The
    // navy shutter theme makes plain names ambiguous, so the colored bars call
    // out which side is which. Default profile keeps plain white names.
    allianceNameBackground: true,
    // WRC-only: start the reveal 1.5s before the victory video ends (default 500ms).
    victoryRevealLeadMs: 1500,
  },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
