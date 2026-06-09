import type { ProfileDefinition } from "../types";
import MatchPreview from "./screens/match-preview/MatchPreview.svelte";
import MatchReady from "./screens/match-ready/MatchReady.svelte";
import ScoresReady from "./screens/scores-ready/ScoresReady.svelte";
import ScoresReveal from "./screens/score-reveal/ScoresReveal.svelte";
import AllianceSelection from "./screens/alliance-selection/AllianceSelection.svelte";
import Timeout from "./screens/time-out/Timeout.svelte";
import PlayoffBracket from "./screens/playoff-bracket/PlayoffBracket.svelte";

const profile: ProfileDefinition = {
  id: "default",
  name: "Default (Red + Blue)",
  // eventName: "Kettering District Event",  // uncomment to override the FMS event name
  theme: {
    // `primary` / `secondary` drive the shutter backgrounds — kept darker than
    // the vivid alliance colors so score boxes / team cards / RP badges (which
    // use `redAlliance` / `blueAlliance`) pop off the shutter behind them.
    primary: "oklch(0.42 0.18 25)",
    secondary: "oklch(0.36 0.20 258)",
    redAlliance: "oklch(0.60 0.235 25)",
    blueAlliance: "oklch(0.53 0.24 258)",
    accentWarn: "oklch(0.88 0.19 92)",
    background: "oklch(0.13 0.012 250)",
    surface: "oklch(0.18 0.014 250)",
    text: "oklch(0.98 0.005 250)",
  },
  assets: {
    event: '/wrc.png',
    sponsors: [],
    livestream: '/pitpodcast.png',
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
    "alliance-selection": AllianceSelection,
    "alliance-selection-fullscreen": AllianceSelection,
    "playoff-bracket": PlayoffBracket,
    timeout: Timeout,
  },
};

export default profile;
