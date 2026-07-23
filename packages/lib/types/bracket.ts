export type PlayoffLevel =
  | "Final"
  | "Level2"
  | "Level3"
  | "Level4"
  | "Level5"
  | "Level6"
  | "Level7";

export type Bracket = "Single" | "DoubleUpper" | "DoubleLower";

export type PlayoffSizeTypes =
  | "TwoAlliance"
  | "FourAlliance"
  | "FiveAlliance"
  | "SixAlliance"
  | "SevenAlliance"
  | "EightAlliance"
  | "SixteenAlliance";

export type PlayoffTiebreakType =
  | "None"
  | "Unknown"
  | "TrueTie"
  | "TieBreakSortOrder1"
  | "TieBreakSortOrder2"
  | "TieBreakSortOrder3"
  | "TieBreakSortOrder4"
  | "TieBreakSortOrder5"
  | "TieBreakSortOrder6";

export type AudienceBracketAlliance = {
  allianceNumber: number;
  allianceName: string;
  einsteinAlliance: string;
  captainTeamNumber: number;
  captainTeamNameShort: string;
  captainAvatar: string;
  firstRoundTeamNumber: number;
  firstRoundTeamNameShort: string;
  firstRoundAvatar: string;
  secondRoundTeamNumber: number;
  secondRoundTeamNameShort: string;
  secondRoundAvatar: string;
  alternateTeamNumber: number;
  alternateTeamNameShort: string;
  alternateAvatar: string;
  cardEffectiveStatus: "None" | "Yellow" | "Red";
};

export type AudienceDoubleElimMatch = {
  matchNumber: number;
  /** Null on the wire for the finals entry. */
  shortName: string | null;
  longName: string | null;
  isComplete: boolean;
  winningAllianceType: "None" | "Red" | "Blue";
  winningAllianceNumber: number;
  /** Null until the feeding matches decide the alliance. */
  redAllianceNumber: number | null;
  redAllianceScore: number;
  blueAllianceNumber: number | null;
  blueAllianceScore: number;
  isNextMatch: boolean;
};

export type BracketData = {
  alliances: AudienceBracketAlliance[];
  doubleElimMatchesList: AudienceDoubleElimMatch[];
  finals: AudienceDoubleElimMatch | null;
  currentLevel: PlayoffLevel;
  allianceCount: PlayoffSizeTypes;
  tournamentType: string;
  season: number;
  eventCode: string;
  eventName: string;
  eventLocation: string;
};
