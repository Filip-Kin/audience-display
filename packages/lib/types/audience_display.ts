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
  | "break-timer"
  | "playoff-bracket"
  | "rankings"
  | "timeout"
  | "background"
  | "schedule";

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
  /** Qualification rank; absent for playoff/finals teams (the wire DTOs carry no rank there). */
  rank?: number;
  avatar?: string;
  /** Optional alternate designation shown next to the number, e.g. "1502B" for a
   *  team playing under a B-team label. Set per team in customADTeams.json. */
  designation?: string;
  card: FMSMatchResultsTeam["cardCarryStatus"];
  rankChange?: FMSMatchResultsTeam["teamRankChange"];
  isCaptain?: boolean;
  potentialCaptain?: boolean;
  unavailableForSelection?: boolean;
  /** Declined a pick during alliance selection (still captain-eligible). */
  declined?: boolean;
};

export type MatchType = "q" | "p" | "t" | "sf" | "f";

export type MatchState = {
  timer: number;
  phase: MatchPhase;
  phaseTimer: number;
  hubActive: "Red" | "Blue" | "Both" | "None";
  /** Live referee "under review" flag (clears when the ref releases it). */
  underReview: boolean;
  /** Latched: true if the match was flagged for review at any point, held until
   *  results post. Drives the waiting-for-scores banner (the live flag is too
   *  transient - refs often release it at the buzzer). */
  underReviewLatched: boolean;
  /** The match has ended (FMS reached WaitingForCommit / matchEnd) and is awaiting
   *  scores. Tracked as its own flag so the score bar shows the match-over state
   *  (frozen scores, "Match Under Review") even if a stray live-screen command
   *  leaves $state.screen on a match-play screen instead of "match-end". Cleared
   *  when the next match prestarts or starts. */
  matchOver: boolean;
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
  /** Short FMS event code (e.g. "MIRR"); undefined until FMS reports it. */
  eventCode?: string;
  /** Season year (e.g. 2026); undefined until FMS reports it. */
  season?: number;
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
  /** Full qualification standings for the rankings screen (from GetQualificationRankData). */
  rankData: QualRanking[];
  bracket: BracketData | null;
  /** Number of REAL playoff alliances. A small event backfills the standard
   *  8-alliance bracket with filler alliances (seeds beyond this count) that
   *  forfeit 1-0; the bracket + alliance-selection screens collapse those away.
   *  8 (default) = no fillers, standard bracket. */
  playoffRealAlliances: number;
  /** Scheduled start of playoff match 1 (ISO), for the bracket screen's pre-playoff countdown. */
  firstPlayoffMatchTime: string | null;
  gameConfig: GameConfig | null;
  activeProfileId: string | null;
  /** Server-side FMS traffic logging switch (settings gear toggles it). */
  fmsLogging: boolean;
  /** Whether the server is auto-positioning the external live-captions overlay
   *  per the current screen (commands live-captions over its tRPC API). */
  captionControl: boolean;
  /** Running app version. Clients reload when it changes so a display picks up a
   *  new UI bundle after the exe auto-updates, without a manual refresh. */
  version: string;
};

export type QualRanking = {
  rank: number;
  teamNumber: number;
  teamName: string;
  /** Base64 PNG from FMS, empty string when the team has none. */
  avatar: string;
  /** Ranking score (average RP); total RP = rankingScore * (wins + losses + ties). */
  rankingScore: number;
  wins: number;
  losses: number;
  ties: number;
};

export type AllianceSelection = {
  allianceNumber: number;
  allianceName: string;
  teams: Team[];
  card: FMSMatchResultsTeam["cardCarryStatus"];
  /** Positional roster [captain, round1, round2, backup]; null = slot not filled yet.
   *  Unlike `teams`, holes are preserved (a skipped alliance can have round 2 before round 1). */
  slots?: (number | null)[];
};
