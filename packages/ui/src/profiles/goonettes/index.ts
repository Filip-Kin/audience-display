import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";
import MatchPreview from "./screens/match-preview/MatchPreview.svelte";
import MatchReady from "./screens/match-ready/MatchReady.svelte";
import ScoresReady from "./screens/scores-ready/ScoresReady.svelte";
import ScoresReveal from "./screens/score-reveal/ScoresReveal.svelte";
import { chrome } from "./components/wrap";
import "./goon.css";

/**
 * Goonettes Invitational - 6th annual girls-only FRC offseason event, hosted by
 * FRC 3604 (The Goon Squad) at Woodhaven High School, 10-11 October 2026.
 *
 * Custom look taken from goonettesinvitational.org (Filip, 2026-10-04: "make
 * it feel like a custom profile and not just a color swap"): bundled display /
 * condensed / brush fonts, lavender pill shapes with the site's white rim, the
 * "Goonettes invitational" lockup and the bow-skull mascot. See goon.css.
 *
 * Screens that carry the look are Goonettes copies of the default screens
 * (score bar, match preview, waiting-for-scores, score reveal). The full-screen
 * pages keep the DEFAULT component and are only wrapped (chrome(), CSS in
 * goon.css), so they keep every default fix automatically. A fix to a default
 * screen under match-ready/, match-preview/, scores-ready/ or score-reveal/
 * must be mirrored into the copy here (THEME-RULES rule 19).
 *
 * Colours come from the event's own site: section purple #771A85 and button
 * ink #2A1543 for the shutter (darkened to clear 3:1 against the alliance
 * colours), lavender button fill #C19AFD for the chrome accent.
 *
 * accentWarn is left at the stock FRC attention YELLOW. It drives under-review
 * cards, yellow/red cards and warning states, and the MARC lesson was that
 * re-colouring it forces a chain of white overrides. The event's own site
 * yellow (#FDDB51 = oklch(0.896 0.156 95.1)) is close to the stock accent
 * anyway, so the default does not look foreign here.
 */
const profile: ProfileDefinition = {
  id: "goonettes",
  name: "Goonettes Invitational",
  // Pin the title: offseason FMS installs routinely report a stale event name.
  // The background screen appends the year, so do NOT put "2026" in here.
  eventName: "Goonettes Invitational",
  // TBA-style code, scopes the avatar store to this event.
  eventCode: "2026mibro1",
  // Schedule-screen QR. PLACEHOLDER: the event has no live schedule page, so
  // this points at the home page. See open question 8 (TBA is the alternative).
  eventInfoUrl: "https://www.goonettesinvitational.org/",
  theme: {
    ...defaultProfile.theme,
    // Default cards on the chrome screens match the Goonettes small radius.
    radius: "16px",
    // Shutter halves. Shutter.svelte defaults to secondary LEFT, primary RIGHT,
    // but MatchPreview.svelte:56 overrides both by alliance side
    // (leftColor = leftIsRed ? primary : secondary), so on match preview the
    // sides follow $settings.invert. Pick two purples that work either way
    // round rather than relying on a fixed left/right assignment.
    // Bright, from the site's section purple #771A85: a violet on the red side
    // and the site purple lifted on the blue side, each hue kept away from the
    // alliance colour it sits under. Filip, 2026-10-04: dark shutters looked
    // gloomy, and brighter reads better on a projector; team names sit on the
    // cards, which give the separation. White on either half is 5.2:1 or better.
    primary: "oklch(0.50 0.22 295)", // violet; white 6.7:1
    secondary: "oklch(0.56 0.21 322)", // site purple, lifted; white 5.2:1
    // Panels: stock lightness, hue moved off blue-grey into the brand purple
    // family, chroma kept low so it reads as a tint and not a colour.
    background: "oklch(0.13 0.018 305)",
    surface: "oklch(0.18 0.022 305)",
    // Chrome accent: the site's lavender button fill (#C19AFD) lifted to
    // L 0.80 so near-black ink on it reads at ~10:1. Headers, rules, bullets,
    // match label, hub arrows, confetti.
    accent: "oklch(0.80 0.13 303)",
    // Drawn straight on the red/blue halves (fuel-gauge arc, bug dividers):
    // pale lavender clears 3:1 on both (3.38 red, 3.96 blue).
    scoreBarAccent: "oklch(0.90 0.06 303)",
    // Stock red is L 0.60, which puts white text at 4.44:1. One hundredth
    // darker clears 4.5:1 and still clears 3:1 over the primary shutter.
    redAlliance: "oklch(0.59 0.235 25)",
    // blueAlliance / accentWarn / text: inherited unchanged. accentWarn stays
    // the FRC attention yellow (Match Under Review).
  },
  assets: {
    // Square-padded Goonettes mascot. MUST be square: ScoresReady renders the
    // event logo in a hard size-[480px] box with no object-contain, so a
    // portrait file is stretched on the match-end screen (see section 4).
    event: "/goonettes/logo.png",
    // Event sponsor row, in the order the event site lists them. Altair and
    // Aptiv were dropped 2026-10-04 at the organisers' request. Both logos are
    // dark ink on transparent (measured), so both get the white card.
    sponsors: [
      { src: "/goonettes/bosch.png", light: true },
      { src: "/goonettes/gc.png", light: true },
    ],
    // Pit Podcast is broadcasting the event, so it takes the dedicated
    // livestream slot on the reveal and alliance-selection screens.
    livestream: "/pitpodcast.png",
  },
  // Custom victory clips, to be produced (section 6). NONE of these files
  // exist yet, so the block stays commented out: uncommenting it before the
  // clips are rendered 404s the video and the cover on every score reveal.
  // With it commented, the profile falls back to /animations/default/*.
  // animations: {
  //   victoryRed: "/animations/goonettes/redwins.mp4",
  //   victoryBlue: "/animations/goonettes/bluewins.mp4",
  //   victoryTie: "/animations/goonettes/tie.mp4",
  //   cover: "/animations/goonettes/first-frame.png",
  // },
  options: {
    // The shutter is purple, not red/blue, so the alliance sides are not
    // self-evident on the match preview. Same reason WRC turned this on.
    allianceNameBackground: true,
    // Set once the victory clips exist and their tail is known. WRC uses 1500
    // because its clip ends on a still; leave at the 500ms default until then.
    // victoryRevealLeadMs: 600,
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
    // Stock layout and behaviour, Goonettes chrome (pill header, rounded
    // panels, fonts) via the wrapper.
    "alliance-selection": chrome(defaultProfile.screens["alliance-selection"]!),
    "alliance-selection-fullscreen": chrome(defaultProfile.screens["alliance-selection-fullscreen"]!),
    "break-timer": chrome(defaultProfile.screens["break-timer"]!),
    "playoff-bracket": chrome(defaultProfile.screens["playoff-bracket"]!),
    rankings: chrome(defaultProfile.screens.rankings!),
    timeout: chrome(defaultProfile.screens.timeout!),
    background: chrome(defaultProfile.screens.background!),
    schedule: chrome(defaultProfile.screens.schedule!),
  },
};

export default profile;
