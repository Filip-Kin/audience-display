import type { ProfileDefinition } from "../types";
import { profileMeta } from "lib";
import defaultProfile from "../default";

/**
 * Great Lakes Bay Bot Bash, 11th annual, hosted by FIRST of the Great Lakes
 * Bay Region at H.H. Dow High School, Midland MI. Load-in Friday 30 Oct 2026,
 * competition Saturday 31 Oct. Pit Podcast streams it.
 *
 * Pure re-theme of the default profile (screens: {}). The event's own art is a
 * red boxing robot versus a blue boxing robot, so its brand colours ARE the
 * alliance colours: the stock red/blue shutter is the brand here. The chrome
 * accent is the host region's lime (FIRST-GLBR mitten), the one colour that is
 * theirs and not an alliance's.
 */
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
    // Chrome accent: the host region's lime off the FIRST-GLBR mitten, Filip's
    // call 2026-10-06, in place of the stock gold. Light enough for the dark
    // accent ink (12.8:1); it only just clears 3:1 on the red alliance
    // (3.01:1), so the score-bar trim gets a paler tint (3.58:1 red, 4.47:1
    // blue). accentWarn stays the FRC yellow for the under-review card.
    accent: "oklch(0.86 0.14 130)",
    scoreBarAccent: "oklch(0.92 0.08 130)",
  },
  assets: {
    // The 2026 event logo off the GLBR site (1100px JPG), white border keyed
    // off by flood fill from the edges so the robots' white bodies stay, and
    // the black "BOT BASH 2026" wordmark (rows 524-586 of the 586px file)
    // flipped to white: the art was drawn for a white page and the black text
    // vanished on the shutter. It is also the glint mask on scores-ready.
    event: "/bot-bash/logo.png",
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
  // Stock red/blue shutter, so the plain white alliance names already carry
  // the side cue; no options needed.
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
