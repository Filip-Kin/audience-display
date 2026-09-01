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
  // GUESS. TBA has 2022miwyo through 2025miwyo; 2026miwyo 404s today. This only
  // scopes avatar-store uploads, it is not sent to TBA, so a wrong code costs
  // nothing but a mismatched avatar namespace. Confirm before uploading avatars.
  eventCode: "2026miwyo",
  theme: {
    ...defaultProfile.theme,
    // Shutter halves. Both kept well below the alliance colours in lightness so
    // score boxes, team cards and RP badges pop off them.
    primary: "oklch(0.40 0.11 148)", // deep Rexi green  (#0A5722)
    secondary: "oklch(0.35 0.09 248)", // deep GRG blue   (#053D67)
    // Alliance colours stay stock. GRG's palette has no red at all, and the
    // alliance red/blue are the one thing on screen that must never be a brand
    // decision.
    redAlliance: "oklch(0.60 0.235 25)",
    blueAlliance: "oklch(0.53 0.24 258)",
    accentWarn: "oklch(0.88 0.19 92)",
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
    event: "/grand-rapids-girls/logo.png",
    // Order = the order the sponsors page lists them, corporates first, then the
    // host/sponsoring teams. Confirm the real 2026 tier order with Wendy.
    sponsors: [
      { src: "/grand-rapids-girls/plasan.png", light: true },
      { src: "/grand-rapids-girls/anzen-unmanned.png" },
      { src: "/grand-rapids-girls/casa-calvo.png" },
      { src: "/grand-rapids-girls/state-bar-michigan.png", light: true },
      { src: "/grand-rapids-girls/team-3875-red-storm.png", light: true },
      { src: "/grand-rapids-girls/team-4003-trisonics.png" },
      { src: "/grand-rapids-girls/team-4967-that-one-team.png" },
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
