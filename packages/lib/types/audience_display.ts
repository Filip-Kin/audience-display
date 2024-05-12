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
  auto: number;
  amp: number;
  speaker: number;
  endgame: number;
  fouls: number;
  noteCount: number;
  noteRequirement: number;
  melodyRP: boolean;
  ensambleRP: boolean;
  rainbowRP: boolean;
  amplified: boolean;
};

export type Team = {
  number: number;
  name: string;
  rank: number;
  avatar?: string;
};

export type MatchType = "q" | "p" | "t" | "sf" | "f";

export type MatchState = {
  timer: number;
  score: {
    red: AllianceScore;
    blue: AllianceScore;
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
