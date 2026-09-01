import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * Goonettes Invitational - 6th annual girls-only FRC offseason event, hosted by
 * FRC 3604 (The Goon Squad) at Woodhaven High School, 10-11 October 2026.
 *
 * Pure re-theme of the default profile (screens: {}), like WRC and MARC. The
 * event identity is greyscale mascot art plus a single purple, so the only
 * theme change is the shutter pair and a purple tint on background/surface.
 *
 * Colours come from the event's own material:
 *  - primary   #562E87, the deep step of the Wix theme's purple ramp
 *  - secondary #470A57, the purple the word "Goonettes" is actually set in
 * Both stay darker than redAlliance/blueAlliance so score boxes and team cards
 * pop off the shutter, same rule as the default and WRC themes.
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
    // Shutter halves. Shutter.svelte defaults to secondary LEFT, primary RIGHT,
    // but MatchPreview.svelte:56 overrides both by alliance side
    // (leftColor = leftIsRed ? primary : secondary), so on match preview the
    // sides follow $settings.invert. Pick two purples that work either way
    // round rather than relying on a fixed left/right assignment.
    primary: "oklch(0.43 0.20 303)", // brighter (#681DA7), 2.04:1 vs redAlliance
    secondary: "oklch(0.35 0.19 318)", // brighter (#600078), 2.19:1 vs blueAlliance
    // Panels: stock lightness, hue moved off blue-grey into the brand purple
    // family, chroma kept low so it reads as a tint and not a colour.
    background: "oklch(0.13 0.018 305)",
    surface: "oklch(0.18 0.022 305)",
    // redAlliance / blueAlliance / accentWarn / text: inherited unchanged.
  },
  assets: {
    // Square-padded Goonettes mascot. MUST be square: ScoresReady renders the
    // event logo in a hard size-[480px] box with no object-contain, so a
    // portrait file is stretched on the match-end screen (see section 4).
    event: "/goonettes/logo.png",
    // Event sponsor row, in the order the event site lists them. All four are
    // dark ink on transparent (measured), so all four get the white card.
    sponsors: [
      { src: "/goonettes/bosch.png", light: true },
      { src: "/goonettes/aptiv.png", light: true },
      { src: "/goonettes/altair.png", light: true },
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
  // Override-only: every omitted screen falls back to the default profile.
  screens: {},
};

export default profile;
