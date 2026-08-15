import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * MARC profile — Michigan-area offseason event, run as a Pit Podcast show.
 *
 * Pure re-theme of the default profile (screens: {}), same as WRC: it only
 * swaps the event branding and pins the avatar event code. Everything else
 * (all screen layouts, the RR-era fixes, caption auto-positioning) is inherited
 * from the default profile via resolveScreen().
 *
 * Branding decisions (Filip, MARC prep):
 *  - Event logo only, NO event sponsors (the event has none). The Pit Podcast
 *    stays as the livestream partner in its dedicated reveal spot since Pit
 *    Podcast is broadcasting the show.
 *  - Colors stay the stock red/blue shutter (no custom theme requested).
 */
const profile: ProfileDefinition = {
  id: "marc",
  name: "MARC (Pit Podcast)",
  // Force the on-screen title to "MARC": the real FMS at the venue still
  // reports "Rainbow Rumble" as its event name, so pin it here rather than
  // trust the live FMS name (same as WRC pins its own title).
  eventName: "MARC",
  // TBA-style event code so the avatar store serves the 2026marc event scope
  // (incl. the custom 9992/9993 avatars for the second 503 / 1502 entries).
  eventCode: "2026marc",
  theme: {
    // Stock default red/blue shutter, but the accent (match name, top-bar trim,
    // breakdown header) is the MARC logo red instead of the default gold. Lifted
    // from the logo's #910B0A so it reads as text on the dark screens.
    ...defaultProfile.theme,
    // Brighter MARC red for the accent (match name, breakdown header, etc.).
    accentWarn: "oklch(0.63 0.245 25)",
    // The scorebar accent bars/borders would blend with the red alliance if they
    // were the red accent, so keep them white there.
    scoreBarAccent: "white",
    // The MARC red reads with poor contrast for the match-number TEXT on the dark
    // top bar / results screen, so render that text white. (The red accent still
    // drives the breakdown header, shift/bug highlights, etc.)
    matchLabel: "white",
  },
  assets: {
    // Center logo on the score-reveal screen. DROP THE FILE at
    // packages/ui/public/marc.png before building (high-res, transparent PNG).
    event: "/marc.png",
    // No event sponsors -> empty carousel on the reveal / chrome screens.
    sponsors: [],
    // Pit Podcast is the broadcaster; keep it in the dedicated livestream slot.
    livestream: "/pitpodcast.png",
  },
  // Custom MARC coin-flip victory videos (a metal MARC medallion spins, lands
  // on the winning alliance's colour, and on its last rotation the Michigan
  // logo swaps to "<COLOR> ALLIANCE WINS"). 1920x1080 / 60fps / 7s.
  animations: {
    victoryRed: "/animations/marc/redwins.mp4",
    victoryBlue: "/animations/marc/bluewins.mp4",
    // Tie: externally-supplied clip (flashes both alliance faces, lands on a
    // "TIE" card). 1024x576 / 24fps, so lower-res than the red/blue clips.
    victoryTie: "/animations/marc/tie.mp4",
    // First frame of the victory videos; covers the buffering gap.
    cover: "/animations/marc/first-frame.png",
  },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
