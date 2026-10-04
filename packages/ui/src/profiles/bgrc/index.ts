import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * BGRC, the Bloomfield Girls Robotics Competition, hosted by FRC 2834 (Bionic
 * Black Hawks) at Bloomfield Hills High School, MI.
 *
 * Pure re-theme of the default profile (screens: {}), same pattern as WRC and
 * MARC. Every screen layout falls back to profiles/default/screens via
 * resolveScreen(); this file only carries branding.
 *
 * Identity note: BGRC has no logo of its own. The look is team 2834's mark:
 * purple #562877 feather slashes on a black hawk head with grey gears. The
 * mark is built for LIGHT backgrounds (36% of its opaque pixels are pure
 * black), so it must never be dropped bare on the dark panel. See the design
 * doc for the event-logo plan.
 */
const profile: ProfileDefinition = {
  id: "bgrc",
  name: "BGRC (Bloomfield Girls Robotics Competition)",
  // Pin the on-screen title. "Bloomfield Girls Robotics Competition" is 37
  // characters and displayEventName() truncates above 35, so it would render as
  // "Bloomfield Girls Robotics Competiti... 2026". Use the short form.
  eventName: "BGRC",
  // TBA-style code, scopes the avatar store to this event. Confirmed on TBA
  // (2026mibg, 17 Oct 2026).
  eventCode: "2026mibg",
  // Schedule-screen QR target. Current Google Sites event page; the old Wix
  // site (bloomfieldhillsrob.wixsite.com/bgrc) still shows 2025 content.
  // CONFIRM with the organisers which URL they want on screen.
  eventInfoUrl: "https://www.team2834.com/events/bgrc",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves, both purple: the 2834 purple hue on the red side, a violet
    // on the blue side. (A graphite half read as a mistake next to the purple.)
    // Dark enough to clear 3:1 under the alliance colours (THEME-RULES rule 10),
    // because this goes on a projector and team cards sit straight on it.
    primary: "oklch(0.31 0.16 308)", // 2834 purple, deep; 3.19:1 vs redAlliance
    secondary: "oklch(0.25 0.12 290)", // deep violet; 3.07:1 vs blueAlliance
    // Chrome accent (headers, rules, bars, match label) in place of the stock
    // gold: a light 2834 lavender, light enough to carry the dark accent ink
    // (10:1). It fails 3:1 on the red alliance, so the score-bar trim gets its
    // own paler tint that clears both (3.24:1 red, 3.96:1 blue).
    accent: "oklch(0.80 0.13 308)",
    scoreBarAccent: "oklch(0.90 0.06 308)",
    // accentWarn stays the FRC attention yellow: under-review card, pick-clock
    // warning. Referee semantics, not branding.
    // Surfaces: default lightness/chroma, hue rotated from 250 to the brand
    // purple 308, so the whole panel sits faintly purple instead of blue-grey.
    background: "oklch(0.13 0.012 308.1)", // #08060B
    surface: "oklch(0.18 0.014 308.1)", // #131016
    text: "oklch(0.98 0.005 308.1)", // #F9F8FB
  },
  assets: {
    // Centre logo on the score-reveal and scores-ready screens. This file does
    // NOT exist yet and is not the raw 2834 logo: see section 4. It must be
    // light-ink or plated art with a transparent background, because
    // ScoresReady uses this same image as the glint mask (a white rectangle
    // plate would make the shimmer sweep the whole card, not the mark).
    event: "/bgrc/logo.png",
    // BLOCKED: no BGRC event sponsor list exists. The team Sponsors page names
    // nobody. Keep this empty until the organisers send logo files; an empty
    // array just gives an empty carousel (same as MARC).
    sponsors: [],
    // Pit Podcast is broadcasting the event, so it takes the dedicated
    // livestream slot on the reveal and alliance-selection screens.
    livestream: "/pitpodcast.png",
  },
  // No custom victory videos yet. Leaving `animations` off means the stock
  // /animations/default/* pack and the stock cover play. If BGRC clips get
  // made, drop them at /animations/bgrc/ and uncomment:
  // animations: {
  //   victoryRed: "/animations/bgrc/redwins.mp4",
  //   victoryBlue: "/animations/bgrc/bluewins.mp4",
  //   victoryTie: "/animations/bgrc/tie.mp4",
  //   cover: "/animations/bgrc/first-frame.png",
  // },
  options: {
    // Both shutter halves are purple/graphite rather than red/blue, so plain
    // white alliance names on the match preview are ambiguous. Same reason WRC
    // turns this on for its navy theme.
    allianceNameBackground: true,
  },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
