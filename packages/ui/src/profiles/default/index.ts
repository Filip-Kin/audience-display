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
  theme: {
    primary: "#DC2626",
    secondary: "#2563EB",
    redAlliance: "#DC2626",
    blueAlliance: "#2563EB",
    accentWarn: "#FACC15",
    background: "#000000",
    surface: "#1F2937",
    text: "#FFFFFF",
  },
  assets: {
    sponsors: [],
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
