import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * C3 profile - Cullen's Cancer Clash (FRC off-season, Northville MI, 24-25 Oct 2026).
 *
 * Pure re-theme of the default profile (screens: {}), same shape as WRC and MARC.
 * Branding only: the two-ink C3 palette on the shutter, the C3 lockup, and the
 * host teams / partners / beneficiary in the sponsor deck.
 *
 * Colour reasoning (see README in offseason-profile-designs/c3-cullens-cancer-clash):
 *  - The brand pink #E5067D is oklch(0.599 0.242 359). The stock red alliance is
 *    oklch(0.60 0.235 25). Same lightness, same chroma, 26 degrees apart in hue.
 *    So brand pink is NEVER used at full strength next to a red team card.
 *  - The shutter halves are both brand colour: a deep magenta-violet and the
 *    pink ink taken dark to plum. (Graphite from the #999 grey ink was tried
 *    first and read as a mistake.) Both stay well under the alliance lightness
 *    so score boxes and team cards still pop.
 *  - primary is the RED side and secondary is the BLUE side on match preview
 *    (MatchPreview: leftColor = leftIsRed ? primary : secondary). Plum went on
 *    the BLUE side deliberately: red-on-plum is the weakest pairing available,
 *    blue-on-plum is the strongest. Swap the two values if it reads wrong on the
 *    wall, it is a one-line change.
 *  - accentWarn stays the FRC attention YELLOW. The MARC lesson: re-colouring it
 *    to a brand colour forces a chain of white overrides for no gain.
 */
const profile: ProfileDefinition = {
  id: "c3",
  name: "C3 (Cullen's Cancer Clash)",
  // Pin the on-screen title. Venue FMS at an off-season event usually reports
  // whatever event the field was last configured for.
  eventName: "Cullen's Cancer Clash",
  // TBA-style code, scopes the avatar store to this event. Confirmed on TBA
  // (2026minor, 24-25 Oct 2026).
  eventCode: "2026minor",
  // Schedule-screen QR target (replaces the game-logo panel on that screen).
  eventInfoUrl: "https://c3robots.org/",
  theme: {
    ...defaultProfile.theme,
    // Shutter, red side: deep magenta-violet. Graphite read as a mistake next to
    // the plum, so both halves are brand colour now. Both halves are dark enough
    // to clear 3:1 under the alliance colours (THEME-RULES rule 10): this goes on
    // a projector and team cards sit straight on it.
    primary: "oklch(0.28 0.14 330)", // 3.40:1 vs redAlliance
    // Shutter, blue side: the pink ink taken down to a deep plum (was L 0.40,
    // 1.74:1 vs blue).
    secondary: "oklch(0.24 0.12 358)", // plum, 3.03:1 vs blueAlliance
    // Chrome accent (headers, rules, bars, match label) in place of the stock
    // gold: light C3 pink, light enough for the dark accent ink (9.5:1). It
    // fails 3:1 on the red alliance, so the score-bar trim gets a paler tint
    // that clears both (3.21:1 red, 3.92:1 blue).
    accent: "oklch(0.80 0.15 355)",
    scoreBarAccent: "oklch(0.90 0.06 355)",
    // Page black and card surface warmed off the stock blue-black onto the pink
    // hue axis, so the whole screen sits in the brand's temperature.
    background: "oklch(0.13 0.012 350)",
    surface: "oklch(0.185 0.015 350)",
    text: "oklch(0.98 0.004 350)",
    // redAlliance / blueAlliance / accentWarn inherited from default on purpose.
    // accentWarn is the FRC yellow for the under-review card; never brand it.
  },
  assets: {
    // Centre logo on the score-reveal, header logo on background/alliance
    // selection, and the mask for the glint sweep on scores-ready.
    event: "/c3/logo.png",
    // Order: the beneficiary first (the event exists for YSC), then the two host
    // teams, then the two FIRST programme partners.
    sponsors: [
      { src: "/c3/ysc.png", light: true },
      { src: "/c3/548.png", light: true },
      { src: "/c3/1038.png" },
      { src: "/c3/first-in-michigan.webp", light: true },
      { src: "/c3/first-ohio.webp", light: true },
    ],
    // Pit Podcast is broadcasting the event, so it takes the dedicated
    // livestream slot on the reveal and alliance-selection screens.
    livestream: "/pitpodcast.png",
  },
  // No custom victory videos yet, so the default pack and the stock cover apply.
  // If we produce them, ship /animations/c3/{redwins,bluewins,tie}.mp4 AND
  // /animations/c3/first-frame.png (never overwrite the shared stock cover).
  options: {
    // The shutter halves are plum and graphite, not red and blue, so put the
    // alliance names on coloured bars in match preview. Same reason WRC does.
    allianceNameBackground: true,
  },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
