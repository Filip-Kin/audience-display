import type {
  FMSMatchResultsTeam,
} from "./FMS_API_audience";
import type { MatchPhase } from "./match_phase";
import type { GameConfig } from "./game_config";
import type { BracketData, PlayoffTiebreakType } from "./bracket";

export type Screen =
  | "none"
  | "match-preview"
  | "match-ready"
  | "match-auton"
  | "match-transition-shift"
  | "match-shift-1"
  | "match-shift-2"
  | "match-shift-3"
  | "match-shift-4"
  | "match-endgame"
  | "match-end"
  | "scores-ready"
  | "score-reveal"
  | "alliance-selection"
  | "alliance-selection-fullscreen"
  | "playoff-bracket"
  | "timeout";

export type AllianceScore = {
  score: number;

  // fuel
  autoFuelPoints: number;
  teleopFuelPoints: number;
  transitionShiftFuelPoints: number;
  shiftFuelPoints: [number, number, number, number]; // shift1..4
  endgameFuelPoints: number;
  totalFuelPoints: number;
  teleopFuelCount: number;
  totalFuelCount: number;

  // climb / tower
  autoClimbPoints: number;
  endgameClimbPoints: number;
  totalClimbPoints: number;

  // bonuses / RP
  energizedAchieved: boolean;
  superchargedAchieved: boolean;
  traversalAchieved: boolean;
  advantageAchieved: boolean | null; // live-only field, null on results endpoint

  // thresholds (echoed from FMS for UI progress bars)
  energizedThreshold: number;
  superchargedThreshold: number;
  traversalThreshold: number;

  rankingPoints: number;

  // penalties
  foulPoints: number;
  adjustPoints: number;
  penalties: {
    g206: boolean;
    g418: boolean;
    g419: boolean;
  };

  isHighScore: boolean; // from result endpoint scoreDetails.isHighScore
};

export type Team = {
  number: number;
  name: string;
  rank: number;
  avatar?: string;
  card: FMSMatchResultsTeam["cardCarryStatus"];
  rankChange?: FMSMatchResultsTeam["teamRankChange"] | "NoChange";
  isCaptain?: boolean;
  potentialCaptain?: boolean;
  unavailableForSelection?: boolean;
};

export type MatchType = "q" | "p" | "t" | "sf" | "f";

export type MatchState = {
  timer: number;
  phase: MatchPhase;
  phaseTimer: number;
  hubActive: "Red" | "Blue" | "Both" | "None";
  underReview: boolean;
  tiebreaker?: PlayoffTiebreakType;
  score: {
    red: AllianceScore;
    blue: AllianceScore;
    winner?: "Red" | "Blue" | "Tie";
  };
  teams: {
    red: Team[];
    blue: Team[];
  };
  details: {
    matchNumber: number;
    matchType: MatchType;
    redAlliance?: string;
    blueAlliance?: string;
    redSeriesWins?: number;
    blueSeriesWins?: number;
  };
};

export type EventDetails = {
  name: string;
  matchCount: number;
};

export type AudienceDisplayState = {
  connected: boolean;
  screen: Screen;
  match: MatchState | null;
  results: MatchState | null;
  eventDetails: EventDetails | null;
  alliances: AllianceSelection[];
  ranking: Omit<Team, "name" | "card">[];
  /** Teams per alliance for the selection ceremony (2/3/4, from FMS allianceSelectionType). */
  allianceSize: number;
  /** Whether the selection clock counting down is a pick clock or a between-rounds break. */
  pickTimerType: "pick" | "break";
  bracket: BracketData | null;
  gameConfig: GameConfig | null;
  activeProfileId: string | null;
};

export type AllianceSelection = {
  allianceNumber: number;
  allianceName: string;
  teams: Team[];
  card: FMSMatchResultsTeam["cardCarryStatus"];
};
