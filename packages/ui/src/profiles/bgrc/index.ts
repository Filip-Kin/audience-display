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
  // EXPECTED code, not a confirmed one: TBA has no 2026mibg event yet
  // (2025mibg exists). Verify before the event or team avatars scope wrong.
  eventCode: "2026mibg",
  // Schedule-screen QR target. Current Google Sites event page; the old Wix
  // site (bloomfieldhillsrob.wixsite.com/bgrc) still shows 2025 content.
  // CONFIRM with the organisers which URL they want on screen.
  eventInfoUrl: "https://www.team2834.com/events/bgrc",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves. Right half is the exact 2834 brand purple; left half is a
    // purple-tinted graphite that echoes the mark's grey gears. Both stay
    // darker than redAlliance/blueAlliance so score boxes and team cards pop.
    primary: "oklch(0.38 0.132 308.1)", // #562877 exactly
    secondary: "oklch(0.30 0.014 308.1)", // #302C33 graphite
    // Alliance colours and accentWarn stay stock. accentWarn is the FRC
    // attention yellow (under-review, cards, warnings); re-colouring it to a
    // brand colour forced a chain of white overrides on MARC. Leave it.
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
