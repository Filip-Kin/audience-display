import type { ProfileDefinition } from "../types";
import { profileMeta } from "lib";
import defaultProfile from "../default";

/**
 * Detroit City Championship (DCC). One-day FRC off-season event for Detroit
 * teams, hosted by the Michigan Engineering Zone (MEZ) at U of D Jesuit High
 * School, 10 October 2026. Pit Podcast streams it from a static camera.
 *
 * Pure re-theme of the default profile (screens: {}), same shape as BGRC and
 * C3. Every screen layout falls back to profiles/default/screens.
 *
 * Colours come straight off the 2026 event logo (Chief Delphi post by the
 * event coordinator, 1024px): a deep teal field #004040 (oklch 0.34 0.06 195),
 * a mint figure #98D0B0 (oklch 0.81 0.07 159) and a gold gear #F8B008
 * (oklch 0.81 0.17 79). The event site (mez.engin.umich.edu/dcc) sits behind
 * a Cloudflare challenge, so nothing was read from its CSS.
 *
 *  - Shutter halves are two tones of the brand teal (hue 200-205), far from
 *    both alliance hues (red 25, blue 258). The red side is the lighter one,
 *    per the 2026-10-04 projector rule; the white team cards carry the
 *    separation.
 *  - The gold gear is NOT the chrome accent. It sits on the same hue as the
 *    FRC attention yellow (accentWarn), so a gold accent would make every
 *    header look like an under-review banner. The accent is the logo's mint
 *    instead; Winner / High Score banners stay gold as on every profile.
 *  - accentWarn, redAlliance and blueAlliance are inherited: referee semantics.
 */
const profile: ProfileDefinition = {
  ...profileMeta("detroit-city"),
  // Pin the on-screen title. Venue FMS at an off-season event usually reports
  // whatever event the field was last configured for. 25 chars, under the
  // 35-char displayEventName() cut.
  eventName: "Detroit City Championship",
  // TBA-style code, scopes the avatar store to this event. Confirmed on TBA
  // (2026midet, 10 Oct 2026; TBA lists 9-10 Oct because of Friday load-in).
  eventCode: "2026midet",
  // Schedule-screen QR target. The official event page.
  eventInfoUrl: "https://mez.engin.umich.edu/dcc/",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves: two-tone teal, the logo's own field lifted on the red
    // side and kept deep on the blue side. Filip picked this over teal/green,
    // the swap, and either half gold (gold swallowed the gear and the Winner
    // banner), 2026-10-06. White clears 4.5:1 on both (5.75:1 / 9.4:1).
    primary: "oklch(0.50 0.09 200)", // brand teal, lifted; #007176
    // The deep half is 1.75:1 against blueAlliance, under the 3:1 the theme
    // check wants, so the console will say so. Chosen from screenshots with
    // blue cards and blue RP badges on it; they read. Same trade the stock
    // default makes with its own dark blue half.
    secondary: "oklch(0.38 0.07 205)", // brand teal, deep; #004C53
    // Chrome accent (headers, rules, bars, match label): the logo's mint, light
    // enough for the dark accent ink (12.8:1). It only just clears 3:1 on the
    // red alliance (3.01:1), so the score-bar trim gets a paler tint that
    // clears both with room (3.57:1 red, 4.46:1 blue).
    accent: "oklch(0.86 0.09 160)",
    scoreBarAccent: "oklch(0.92 0.05 160)",
    // Page black and card surface moved from the stock blue-black onto the
    // teal hue, so the whole panel sits in the logo's temperature.
    background: "oklch(0.13 0.012 195)",
    surface: "oklch(0.18 0.014 195)",
    text: "oklch(0.98 0.005 195)",
  },
  assets: {
    // Centre logo on the score-reveal and scores-ready screens, and the glint
    // mask. The 2026 logo with its teal field keyed out (the source is a flat
    // RGB PNG); mint, gold and white ink on alpha.
    event: "/detroit-city/logo.png",
    // Host: the Michigan Engineering Zone. Their official lockup (skyline,
    // MEZ, Michigan Engineering, handwritten ZONE), 2294px from the MEZ site's
    // uploads (wp-content bypasses the site's Cloudflare challenge; the pages
    // do not). Navy and maize on transparent, built for white, so it takes the
    // white card. MEZ also uses a newer square "MEZ / MICHIGAN ENGINEERING
    // ZONE" wordmark on LinkedIn, but nothing above 200px of it exists online.
    sponsors: [{ src: "/detroit-city/mez.png", light: true }],
    // Pit Podcast streams the event, so it takes the livestream slot on the
    // reveal and alliance-selection screens.
    livestream: "/pitpodcast.png",
  },
  options: {
    // Both shutter halves are teal rather than red/blue, so plain white
    // alliance names on the match preview lose the side cue. Same reason WRC,
    // GRG and BGRC turn this on.
    allianceNameBackground: true,
  },
  // No custom victory videos: the stock /animations/default/* pack and cover.
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
