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
 *  - The shutter halves are the brand's two inks darkened: graphite (the #999
 *    grey ink) and deep plum (the pink ink). Both stay well under the alliance
 *    lightness so score boxes and team cards still pop.
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
  // UNCONFIRMED. 2025 was "2025minor" (FRC Events code MINOR) but the 2026 page
  // does not exist yet. Uncomment once FIRST publishes it, so the avatar store
  // serves the right event scope.
  // eventCode: "2026minor",
  // Schedule-screen QR target (replaces the game-logo panel on that screen).
  eventInfoUrl: "https://c3robots.org/",
  theme: {
    ...defaultProfile.theme,
    // Shutter, red side: graphite. The grey ink of the logo, taken dark.
    primary: "oklch(0.37 0.04 340)", // graphite, lifted (#4E3746), 2.40:1 vs redAlliance
    // Shutter, blue side: deep plum. The pink ink, taken dark.
    secondary: "oklch(0.40 0.19 358)", // plum, brighter (#8D0047), 1.74:1 vs blueAlliance
    // Page black and card surface warmed off the stock blue-black onto the pink
    // hue axis, so the whole screen sits in the brand's temperature.
    background: "oklch(0.13 0.012 350)",
    surface: "oklch(0.185 0.015 350)",
    text: "oklch(0.98 0.004 350)",
    // redAlliance / blueAlliance / accentWarn inherited from default on purpose.
    // scoreBarAccent and matchLabel intentionally unset (they default to
    // accentWarn, which is correct here).
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
