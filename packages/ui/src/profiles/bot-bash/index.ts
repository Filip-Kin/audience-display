import type { ProfileDefinition } from "../types";
import { profileMeta } from "lib";
import defaultProfile from "../default";
import { spooky } from "./components/wrap";
import "./bot-bash.css";

/**
 * Great Lakes Bay Bot Bash, 11th annual, hosted by FIRST of the Great Lakes
 * Bay Region at H.H. Dow High School, Midland MI. Load-in Friday 30 Oct 2026,
 * competition Saturday 31 Oct. Pit Podcast streams it.
 *
 * Default layouts with a Halloween layer (the event falls on the 31st and staff
 * asked for "somewhat spooky"): see bot-bash.css and components/Chrome.svelte.
 * The event's own art is a red boxing robot versus a blue boxing robot, so its
 * brand colours ARE the alliance colours: the stock red/blue shutter is the
 * brand here. The chrome accent is the host region's lime (FIRST-GLBR mitten),
 * the one colour that is theirs and not an alliance's, and it doubles as the
 * slime.
 */
// One wrapped instance per default component: the router treats match-end and
// scores-ready as the same screen, so they must stay the same component.
const screens = defaultProfile.screens;
const page = (id: keyof typeof screens) => spooky(screens[id]!);
const scoresReady = spooky(screens["scores-ready"]!, "shutter");
const allianceSelection = page("alliance-selection");

const profile: ProfileDefinition = {
  ...profileMeta("bot-bash"),
  // Pin the on-screen title. The venue's FMS hosts the March district too.
  // 24 chars, under the 35-char displayEventName() cut.
  eventName: "Great Lakes Bay Bot Bash",
  // TBA-style code, scopes the avatar store to this event. Confirmed on TBA
  // (2026mimid1, 30-31 Oct 2026).
  eventCode: "2026mimid1",
  // Schedule-screen QR target: the event page on the region's site.
  eventInfoUrl: "https://www.first-glbr.org/great-lakes-bay-bot-bash.html",
  theme: {
    ...defaultProfile.theme,
    // Rounder cards than stock (8px), to sit with the soft mitten and the
    // cartoon robots. Same radius Goonettes uses. Filip, 2026-10-06.
    radius: "16px",
    // Chrome accent: the host region's lime off the FIRST-GLBR mitten, Filip's
    // call 2026-10-06, in place of the stock gold. Light enough for the dark
    // accent ink (12.8:1); it only just clears 3:1 on the red alliance
    // (3.01:1), so the score-bar trim gets a paler tint (3.58:1 red, 4.47:1
    // blue). accentWarn stays the FRC yellow for the under-review card.
    accent: "oklch(0.86 0.14 130)",
    scoreBarAccent: "oklch(0.92 0.08 130)",
    // Night purple in place of the stock blue-black. Same lightness as stock,
    // so text and panel contrast do not move.
    background: "oklch(0.13 0.035 300)",
    surface: "oklch(0.18 0.045 300)",
  },
  assets: {
    // The FIRST-GLBR mark without its words: the mitten and the FIRST icon,
    // composed from the region's horizontal lockup (first-glbr.org, 1867px)
    // into the vertical arrangement they use elsewhere. Filip picked it over
    // the event's own boxing-robots art on 2026-10-06: that art is black ink
    // on a white page and died on the shutter. It is also the glint mask on
    // scores-ready; its background is alpha, so the sweep follows the mark.
    event: "/bot-bash/logo.png",
    // The event's own boxing robots in their Halloween cut (tools/bot-bash-logo)
    // take the big logo spots. Unlike the original, this cut reads on dark and on
    // the shutter, and it is alpha outside the badges, so it can be the glint mask.
    eventLarge: "/bot-bash/versus-spooky.png",
    // FIRST-GLBR's "Financial Sponsors" from first-glbr.org/our-sponsors
    // (Dow, DuPont, Nexteer), then the host region itself. All four are dark
    // ink on white, so all four take the white card. The "Other Supporters"
    // (MDE, Midland Public Schools, FIRST in Michigan, MSU) are facilities and
    // regional support, not event sponsors, and are left off.
    sponsors: [
      { src: "/bot-bash/dow.png", light: true },
      { src: "/bot-bash/dupont.png", light: true },
      { src: "/bot-bash/nexteer.png", light: true },
      { src: "/bot-bash/first-glbr.png", light: true },
    ],
    // Pit Podcast streams the event, so it takes the livestream slot.
    livestream: "/pitpodcast.png",
  },
  // Graveyard win clips: a jack-o-lantern robot wakes up, one lightning strike,
  // the alliance colour slimes down the screen and the letters rise, with "BOT
  // BASH" under them. 7.5 s, 60 fps, synthesised sound. Source is in
  // tools/bot-bash-win-animations. Frame 0 is the same in all three, so one
  // cover serves them.
  animations: {
    victoryRed: "/animations/bot-bash/redwins.mp4",
    victoryBlue: "/animations/bot-bash/bluewins.mp4",
    victoryTie: "/animations/bot-bash/tie.mp4",
    cover: "/animations/bot-bash/first-frame.png",
  },
  // Stock red/blue shutter, so the plain white alliance names already carry
  // the side cue.
  options: {
    // The name is up by 4.9 s, so open onto the results at 6.0 s.
    victoryRevealLeadMs: 1500,
    // Fit the venue's vMix layout (test shot, 2026-10-30): the top bar sits in
    // the gap between the two corner cameras, and the bug drops 24px to clear
    // the field wall in the wide shot.
    topBarBetween: [760, 1165],
    topBarArt: "/bot-bash/versus-spooky.png",
    scoreBarBottom: 36,
    // The cameras show through the shutter on the preview, waiting and results
    // screens.
    shutterOpacity: 0.6,
  },
  // Override-only: omitted screens fall back to the default profile. The score
  // bar screens are left stock on purpose, they run over the field camera, and
  // so are the reveal (its own win clips) and the award lower third.
  screens: {
    "match-preview": spooky(screens["match-preview"]!, "shutter"),
    "match-end": scoresReady,
    "scores-ready": scoresReady,
    "alliance-selection": allianceSelection,
    "alliance-selection-fullscreen": allianceSelection,
    "break-timer": page("break-timer"),
    "playoff-bracket": page("playoff-bracket"),
    rankings: page("rankings"),
    timeout: page("timeout"),
    background: page("background"),
    schedule: page("schedule"),
  },
};

export default profile;
