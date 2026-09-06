import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * Ferris State Roboday, FRC off-season at Jim Wink Arena, Big Rapids MI.
 *
 * Pure re-theme (screens: {}), same shape as WRC and MARC. The event itself has
 * no published logo, colours or tagline, so the identity is the university's:
 * Ferris Crimson #BA0C2F and Ferris Gold #FFD043, plus the white horizontal
 * wordmark, which is the only asset that drops cleanly onto a dark screen.
 */
const profile: ProfileDefinition = {
  id: "fsu-roboday",
  name: "Ferris State Roboday",
  // Pin the title: FIRST calls the code MIBIG1 but the event name has been both
  // "FSU Roboday" (2019) and "Ferris State Roboday" (2024+). Use the current one.
  eventName: "Ferris State Roboday",
  // TBA-style code for the avatar store. UNVERIFIED: we confirmed 2026mibig1
  // 404s on TBA, but never confirmed 2026mibr resolves. Check it before the
  // event or avatars fall back to the live FMS-derived code.
  eventCode: "2026mibr",
  // Schedule-screen QR. FIRST's page is authoritative and carries rankings and
  // results. Swap to https://www.thebluealliance.com/event/2026mibr if the
  // organisers prefer the phone-friendlier page.
  eventInfoUrl: "https://frc-events.firstinspires.org/2026/MIBIG1",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves in two Ferris Crimson tones (WRC does the same with navy).
    // Both stay well below redAlliance/blueAlliance lightness so score boxes,
    // team cards and RP badges pop off them.
    primary: "oklch(0.42 0.19 22)", // Ferris Crimson, brighter (1.97:1 vs redAlliance)
    secondary: "oklch(0.32 0.16 21)", // deep crimson, lifted off near-black (2.31:1 vs blueAlliance)
    // Red alliance untouched. A 4-degree hue rotation (#EC133D vs #EC172D) is
    // not visible on a projector, and the alliance colours are the one thing on
    // screen that must never be a brand decision.
    redAlliance: "oklch(0.60 0.235 25)",
    // Blue alliance untouched: FRC alliance semantics beat the brand guide.
    blueAlliance: "oklch(0.53 0.24 258)",
    // accentWarn is NOT set. It paints yellow cards, the MATCH UNDER REVIEW
    // banner and the warning pill, so it is referee semantics, not branding
    // (THEME-RULES.md rules 1 and 2). Ferris Gold is close enough to the stock
    // accent that setting it buys nothing and desaturates the attention colour:
    // stock clamps to #FFD100, the Ferris value renders #FDCE3E.
    // Near-black warmed to the crimson hue instead of the stock blue tint.
    background: "oklch(0.13 0.012 25)",
    surface: "oklch(0.18 0.014 25)",
    text: "oklch(0.98 0.005 25)",
  },
  assets: {
    // Centre logo on scores-ready / score-reveal. MUST be near square: when the
    // glint is not running, ScoresReady renders it in a fixed size-[480px] box
    // with no object-fit, so a wide wordmark stretches. See section 4.
    event: "/fsu-roboday/bulldog.png",
    // Ferris State is the only sponsor we can evidence. The white wordmark reads
    // on the dark background bare, so no white card (light omitted, NOT true:
    // a white logo on a white card disappears).
    // Host first, then the two event sponsors Filip confirmed (2026-09-05).
    // None of the three needs `light`: all are reversed art that reads on the
    // crimson shutter, so no white cards on this profile.
    sponsors: [
      // Ferris State is also carried by the event logo, but the bulldog is the
      // athletics mascot mark, not the university wordmark. The deck is where
      // the institution is named, so the wordmark stays. One line to drop.
      { src: "/fsu-roboday/ferris-wordmark-white.png" },
      // Reused from the Rainbow Rumble deck: 1500x750, already reversed.
      { src: "/fsu-roboday/ctre.png" },
      // Filip supplied the full-colour lockup (purple wordmark, red fox). It
      // shipped on a baked white background, so the background was flood-filled
      // from the border and dropped; keying every white pixel would have punched
      // holes through the counters in A, d, y, a and R. Dark ink, so it takes
      // the white card.
      { src: "/fsu-roboday/andymark.png", light: true },
    ],
    // Pit Podcast is broadcasting the event, so it takes the dedicated
    // livestream slot on the reveal and alliance-selection screens.
    livestream: "/pitpodcast.png",
  },
  animations: {
    // Custom victory stings, see section 6. Until they exist this key can stay
    // omitted and the stock /animations/default/* pack plays.
    // victoryRed: "/animations/fsu-roboday/redwins.mp4",
    // victoryBlue: "/animations/fsu-roboday/bluewins.mp4",
    // victoryTie: "/animations/fsu-roboday/tie.mp4",
    // cover: "/animations/fsu-roboday/first-frame.png",
  },
  options: {
    // Both shutter halves are crimson, so the plain white alliance names on the
    // match preview lose the red/blue cue. Same fix WRC uses for its navy shutter.
    allianceNameBackground: true,
  },
  // Override-only: every omitted screen falls back to the default profile.
  screens: {},
};

export default profile;
