import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * Grand Rapids Girls Robotics Competition (GRG). One-day all-girls FRC
 * off-season event, Allendale High School, Michigan, 26 September 2026.
 *
 * Pure re-theme of the default profile (screens: {}), same shape as WRC and
 * MARC. All screen layouts are inherited via resolveScreen().
 *
 * Branding decisions:
 *  - The event has no brand guide. Every colour here is derived from the site's
 *    Divi theme CSS (#38A5FF nav blue, #90C340 lime, #121212 dark section) or
 *    sampled from the Rexi logo art. Re-check with the organisers before print.
 *  - Shutter halves are Rexi green + GRG blue instead of the stock red/blue, so
 *    the only saturated red and blue on screen belong to the alliances.
 *  - accentWarn stays the stock FRC attention yellow. The MARC lesson: recolour
 *    it to a brand colour and you buy a chain of white overrides.
 */
const profile: ProfileDefinition = {
  id: "grand-rapids-girls",
  name: "Grand Rapids Girls Robotics Competition",
  // On-screen title. displayEventName() truncates past 35 chars, and the full
  // "Grand Rapids Girls Robotics Competition" is 39, so "Competition" is
  // dropped rather than shown as "...".
  eventName: "Grand Rapids Girls Robotics",
  // Schedule-screen QR target (replaces the game logo panel on that screen).
  eventInfoUrl: "https://girlsrobotics.org/event-agenda/",
  // CONFIRMED 2026-09-11: TBA created 2026miwyo
  // (thebluealliance.com/event/2026miwyo). Was a guess extrapolated from
  // 2022miwyo-2025miwyo. Scopes avatar-store uploads.
  eventCode: "2026miwyo",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves. Both kept well below the alliance colours in lightness so
    // score boxes, team cards and RP badges pop off them.
    // Two-tone green (Filip picked option C, 2026-09-01). Both halves sit in
    // the Rexi green family rather than splitting green against blue, so the
    // shutter reads as one colour and the alliance red/blue stay the only
    // saturated red and blue on screen.
    primary: "oklch(0.52 0.19 150)", // bright Rexi green (#00841F)
    secondary: "oklch(0.37 0.14 160)", // deep green (#005423)
    // Alliance colours stay stock. GRG's palette has no red at all, and the
    // alliance red/blue are the one thing on screen that must never be a brand
    // decision.
    redAlliance: "oklch(0.60 0.235 25)",
    blueAlliance: "oklch(0.53 0.24 258)",
    // accentWarn STAYS the FRC attention yellow: it paints yellow/red cards,
    // the MATCH UNDER REVIEW banner and the warning pill, which are referee
    // semantics rather than branding.
    accentWarn: "oklch(0.88 0.19 92)",
    // The event's accent is the bright teal off Rexi's disc (#54CCCC), taken
    // lighter so it clears 3:1 on both alliance colours: 3.23:1 on red, 3.94:1
    // on blue, 6.50:1 on the blue shutter half. matchLabel colours the match
    // number in the top bar and on the results screen; scoreBarAccent colours
    // the score-bar trim, the shift bar and the fuel-gauge arc. Both default to
    // accentWarn, so setting them is how a profile gets a brand accent without
    // touching the card colours.
    matchLabel: "oklch(0.88 0.11 190)",
    scoreBarAccent: "oklch(0.88 0.11 190)",
    // Near-black with a faint green cast, sitting between the default's blue-cast
    // black and the site's flat #121212.
    background: "oklch(0.15 0.008 150)", // #090C09
    surface: "oklch(0.20 0.010 150)", // #131714
    text: "oklch(0.98 0.005 250)",
  },
  assets: {
    // Centre logo on the score-reveal, and the mask for the glint sweep on
    // scores-ready. MUST have alpha (see Assets below): the source art is a
    // JPEG with no alpha, which would make the glint sweep a plain rectangle.
    event: "/grand-rapids-girls/logo.svg",
    // Order follows the 2026 shirt back (Trista's file, via Alexandra
    // 2026-09-11), which is the authoritative sponsor list for this year:
    // Albers/Cramer Trust, then Anzen Unmanned + Allendale Robotics, then the
    // three host teams on one slide so they read as a group.
    //
    // 2026-09-11 changes, all from Trista/Wendy via Alexandra:
    //  - Plasan and Casa Calvo REMOVED: neither sponsored in 2026. Their art is
    //    deleted rather than commented out; recover from git if they return.
    //  - Albers/Cramer Trust ADDED (they funded this year's scholarship).
    //  - GVSU ADDED. Not on the shirt back, requested separately.
    sponsors: [
      // Wordmark lifted from the shirt back PDF (the only art anyone has for
      // them) and recoloured white, set on two lines so it is not a hairline of
      // text inside object-contain. Reads bare on green.
      { src: "/grand-rapids-girls/albers-cramer-trust.png" },
      // Gold gradient wordmark, already reversed-friendly, reads bare on green.
      { src: "/grand-rapids-girls/anzen-unmanned.png" },
      // GVSU's approved 2-colour primary lockup (blue logomark left of a black
      // logotype). Their brand guide says do not recolour the primary logo, so
      // it takes the white card rather than being knocked out to white. The
      // official files sit behind a gvsu.edu login; this is the same lockup
      // from a public vector mirror.
      { src: "/grand-rapids-girls/gvsu.png", light: true },
      // Black-on-transparent, off the shirt back. PENDING: Alexandra emailed to
      // ask whether Allendale Robotics is just the org behind 4003 TriSonics or
      // a separate sponsor. The shirt lists it in the sponsor row, separate from
      // the team logos, so it gets its own slide until she hears back. Drop this
      // line if it turns out to be TriSonics.
      { src: "/grand-rapids-girls/allendale-robotics.png", light: true },
      // 3875 Red Storm, 4003 TriSonics and 4967 That ONE Team on one slide.
      // 4967's mark is block lettering on a flat tile, so it was upscaled 4x
      // with NEAREST rather than a smooth filter, which would blur the blocks.
      { src: "/grand-rapids-girls/host-teams.png", light: true },
    ],
    // Pit Podcast is broadcasting the event, so it takes the dedicated
    // livestream slot on the reveal and alliance-selection screens.
    livestream: "/pitpodcast.png",
  },
  options: {
    // The shutter is green + blue, not red + blue, so plain white alliance names
    // on the match preview lose the side cue. Same reason WRC sets this.
    allianceNameBackground: true,
    // Set only if custom victory videos ship (see Custom animation ideas).
    // victoryRevealLeadMs: 1500,
  },
  // No custom victory videos yet: falls back to /animations/default/*. If custom
  // clips ship, this profile MUST also ship its own first-frame cover and must
  // NOT overwrite the shared stock cover.
  // animations: {
  //   victoryRed: "/animations/grand-rapids-girls/redwins.mp4",
  //   victoryBlue: "/animations/grand-rapids-girls/bluewins.mp4",
  //   victoryTie: "/animations/grand-rapids-girls/tie.mp4",
  //   cover: "/animations/grand-rapids-girls/first-frame.png",
  // },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
