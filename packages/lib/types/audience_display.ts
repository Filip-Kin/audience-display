import type { FMSMatchPreviewTeam, FMSMatchResultsTeam } from "./FMS_API_audience";

export type Screen =
  | "none"
  | "match-preview"
  | "match-ready"
  | "match-auton"
  | "match-transition"
  | "match-teleop"
  | "match-endgame"
  | "match-end"
  | "scores-ready"
  | "score-reveal";

export type AllianceScore = {
  score: number;
  autoMobility: number;
  coral: number;
  algae: number;
  barge: number;
  fouls: number;
  algaeCount: number;
  autoBonusRP: boolean;
  coralBonusRP: boolean;
  coralBonusProgress: number;
  coralBonusThreshold: number;
  bargeBonusRP: boolean;
  coopertitionMet: boolean;
  coopertitionAchieved: boolean;
  rankingPoints: number;
};

export type Team = {
  number: number;
  name: string;
  rank: number;
  avatar?: string;
  card: FMSMatchPreviewTeam["cardCarryStatus"];
  rankChange?: FMSMatchResultsTeam["teamRankChange"];
};

export type MatchType = "q" | "p" | "t" | "sf" | "f";

export type MatchState = {
  timer: number;
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
  eventDetails: EventDetails | null;
};
