export type Screen =
  | "none"
  | "match-preview"
  | "match-ready"
  | "match-auton"
  | "match-transition"
  | "match-teleop"
  | "match-end"
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
  harmonyRP: boolean;
  rainbowRP: boolean;
};

export type Team = {
  number: number;
  name: string;
  rank: number;
};

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
};

export type AudienceDisplayState = {
  connected: boolean;
  screen: Screen;
  match: MatchState | null;
};
