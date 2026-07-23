import type { Bracket, PlayoffLevel, PlayoffSizeTypes, PlayoffTiebreakType } from "./bracket";

/** Real FMS tournament levels (web bundle enum TournamentLevel). */
export enum LevelParam {
  None,
  Practice,
  Qualification,
  Playoff
}

export type CardStatus = "None" | "Yellow" | "Red";

/**
 * Video switch options the real FMS can broadcast
 * (web bundle enum VideoSwitchOption, 19 values).
 */
export type VideoSwitchOption =
  | "Background"
  | "MatchPreview"
  | "VideoOnly"
  | "VideoAndScore"
  | "MatchResult"
  | "Rankings"
  | "Schedule"
  | "Alliance"
  | "AllianceHybrid"
  | "AllianceFullscreen"
  | "Bracket"
  | "Timeout"
  | "Award"
  | "AwardAssignment"
  | "WifiReminder"
  | "Message"
  | "TimerBug"
  | "RegionalPreviouslyQualified"
  | "RegionalAdvancers";

// #region Match previews

/** Team entry for test/practice/qual previews (QualMatchTeamData). */
export interface FMSQualPreviewTeam {
  teamNumber: number;
  teamName: string | null;
  teamRank: number;
  avatar: string;
  carryingCard: boolean;
}

export interface FMSQualPreviewAlliance {
  team1: FMSQualPreviewTeam;
  team2: FMSQualPreviewTeam;
  team3: FMSQualPreviewTeam;
}

/** GetTestMatchPreviewData / GetPracticeMatchPreviewData / GetQualMatchPreviewData. */
export interface FMSQualMatchPreview {
  matchNumber: number;
  numberOfPracticeMatches?: number;
  numberOfQualMatches?: number;
  matchDescription: string;
  eventName: string;
  eventCode?: string;
  tournamentType: string;
  redAlliance: FMSQualPreviewAlliance;
  blueAlliance: FMSQualPreviewAlliance;
}

/** Playoff/finals preview team (AudienceMatchPreviewPlayoffTeamData): 3 fields only, no rank or cards. */
export interface FMSPlayoffPreviewTeam {
  teamNumber: number;
  teamName: string | null;
  avatar: string;
}

/** Playoff/finals preview alliance (AudienceMatchPreviewPlayoffAllianceData); card is alliance-level. */
export interface FMSPlayoffPreviewAlliance {
  allianceName: string | null;
  allianceNumber: number;
  carryingCard: boolean;
  team1: FMSPlayoffPreviewTeam;
  team2: FMSPlayoffPreviewTeam;
  team3: FMSPlayoffPreviewTeam;
  /** Backup slot; may be null or a zeroed team when unfilled. */
  team4?: FMSPlayoffPreviewTeam | null;
}

export interface FMSPlayoffAdvancement {
  matchNumber: number;
  matchLevel: PlayoffLevel;
  matchBracket: Bracket;
  matchDescription: string;
  isEliminated: boolean;
}

/** GetDoubleElimPlayoffMatchPreviewData. */
export interface FMSPlayoffMatchPreview {
  matchNumber: number;
  matchDescription: string;
  eventName: string;
  tournamentType: string;
  playoffLevel: PlayoffLevel;
  playoffBracket: Bracket;
  allianceCount: PlayoffSizeTypes;
  winnerPlayoffAdvancementData: FMSPlayoffAdvancement;
  loserPlayoffAdvancementData: FMSPlayoffAdvancement;
  redAlliance: FMSPlayoffPreviewAlliance;
  blueAlliance: FMSPlayoffPreviewAlliance;
}

/** GetDoubleElimFinalMatchPreviewData: playoff preview shape plus the best-of-3 series wins. */
export interface FMSFinalMatchPreview extends FMSPlayoffMatchPreview {
  redWins: number;
  blueWins: number;
}

// #endregion

// #region Match results

/** Test/practice/qual results team (MatchResultsQualTeamData). */
export interface FMSMatchResultsTeam {
  teamNumber: number;
  teamName: string | null;
  teamRank: number;
  /** RankingChangeType; null observed pre-event on zeroed team slots. */
  teamRankChange: "Up" | "Down" | "NoChange" | null;
  avatar: string;
  cardCarryStatus: CardStatus;
  cardEffectiveStatus: CardStatus;
}

export interface FMSQualResultsAlliance {
  scoreDetails: AllianceScoreDetails;
  team1: FMSMatchResultsTeam;
  team2: FMSMatchResultsTeam;
  team3: FMSMatchResultsTeam;
}

/** GetMatchResultsTestMatchData / GetMatchResultsPracticeData / GetMatchResultsQualData. */
export type FMSQualMatchScore = {
  matchNumber: number;
  numberOfQualMatches?: number;
  matchDescription: string;
  eventName: string;
  eventCode: string;
  season: number;
  tournamentType: string;
  redAllianceData: FMSQualResultsAlliance;
  blueAllianceData: FMSQualResultsAlliance;
  matchWinner: "Red" | "Blue" | "None" | null;
};

/** Playoff/finals results team: 3 fields only (cards live at alliance level). */
export interface FMSPlayoffResultsTeam {
  teamNumber: number;
  teamName: string | null;
  avatar: string;
}

export interface FMSPlayoffResultsAlliance {
  allianceName: string | null;
  allianceNumber: number;
  scoreDetails: AllianceScoreDetails;
  cardCarryStatus: CardStatus;
  cardEffectiveStatus: CardStatus;
  playoffAdvancementStatus: FMSPlayoffAdvancement;
  team1: FMSPlayoffResultsTeam;
  team2: FMSPlayoffResultsTeam;
  team3: FMSPlayoffResultsTeam;
  /** Backup slot; may be null or a zeroed team when unfilled. */
  team4?: FMSPlayoffResultsTeam | null;
}

/** Finals alliance swaps playoffAdvancementStatus for seriesWins. */
export interface FMSFinalResultsAlliance {
  allianceName: string | null;
  allianceNumber: number;
  seriesWins: number;
  scoreDetails: AllianceScoreDetails;
  cardCarryStatus: CardStatus;
  cardEffectiveStatus: CardStatus;
  team1: FMSPlayoffResultsTeam;
  team2: FMSPlayoffResultsTeam;
  team3: FMSPlayoffResultsTeam;
  /** Backup slot; may be null or a zeroed team when unfilled. */
  team4?: FMSPlayoffResultsTeam | null;
}

/** GetMatchResultsDoubleElimPlayoffData. */
export type FMSPlayoffMatchScore = {
  matchNumber: number;
  matchDescription: string;
  eventName: string;
  eventCode: string;
  season: number;
  tournamentType: string;
  playoffBracket: Bracket;
  allianceCount: PlayoffSizeTypes;
  playoffLevel: PlayoffLevel;
  redAllianceData: FMSPlayoffResultsAlliance;
  blueAllianceData: FMSPlayoffResultsAlliance;
  matchWinner: "Red" | "Blue" | "None" | null;
  tiebreaker: PlayoffTiebreakType | null;
};

/** GetMatchResultsDoubleElimFinalData. */
export type FMSFinalMatchScore = Omit<FMSPlayoffMatchScore, "redAllianceData" | "blueAllianceData"> & {
  redAllianceData: FMSFinalResultsAlliance;
  blueAllianceData: FMSFinalResultsAlliance;
};

// #endregion

export interface FMSMatchSchedule {
  scheduleDetailId: string,
  tournamentLevel: keyof typeof LevelParam,
  fmsEventId: string,
  startTime: string,
  description: string,
  dayNumber: number | null,
  fieldType: string,
  matchNumber: number,
  teamNumberBlue1: number,
  teamNumberBlue2: number,
  teamNumberBlue3: number,
  teamNumberRed1: number,
  teamNumberRed2: number,
  teamNumberRed3: number,
  finalScoreBlue: number | null,
  finalScoreRed: number | null,
  matchStatus: string,
  redAllianceNumber: number | null,
  blueAllianceNumber: number | null;
}

export type FMSBracketDataMatchScore = {
  matchNumber: number;
  shortName: string | null;
  longName: string | null;
  isComplete: boolean;
  winningAllianceType: "Red" | "Blue" | "None";
  winningAllianceNumber: number | null;
  redAllianceNumber: number | null;
  blueAllianceNumber: number | null;
  redAlliance: FMSAllianceSelection;
  blueAlliance: FMSAllianceSelection;
};

export type AllianceScoreDetails = {
  win: boolean;
  tie: boolean;
  totalScore: number;
  isHighScore: boolean;
  autoFuelPoints: number;
  autoClimbPoints: number;
  teleopFuelPoints: number;
  teleopClimbPoints: number;
  penaltyPoints: number;
  energizedAchieved: boolean;
  superchargedAchieved: boolean;
  traversalAchieved: boolean;
  rankingPoints: number;
};

export type FMSAllianceSelection = {
  allianceNumber: number;
  allianceName: string;
  einsteinAlliance: string;
  isEinstein: boolean;

  captainTeamNumber: number | null;
  captainTeamNameShort: string;
  captainAvatar: string;

  firstRoundTeamNumber: number | null;
  firstRoundTeamNameShort: string;
  firstRoundAvatar: string;

  secondRoundTeamNumber: number | null;
  secondRoundTeamNameShort: string;
  secondRoundAvatar: string;

  alternateTeamNumber: number | null;
  alternateTeamNameShort: string;
  alternateAvatar: string;

  cardEffectiveStatus: CardStatus;
};

export type FMSRankingTeam = {
  rank: number;
  teamNumber: number;
  inPotentialCaptainPosition: boolean;
};

/** One entry of GetQualificationRankData's teamRanks (AudienceQualRankingTeamData). */
export type FMSQualRankTeam = {
  rank: number;
  /** Base64 PNG, may be empty. */
  teamAvatar: string;
  teamNumber: number;
  teamName: string;
  /** sort1 is the ranking score (average ranking points). */
  sort1: number;
  sort2: number;
  sort3: number;
  sort4: number;
  sort5: number;
  sort6: number;
  wins: number;
  losses: number;
  ties: number;
};

/** GetQualificationRankData response (AudienceQualRankingData). */
export type FMSQualRankData = {
  eventDescription: string;
  eventLocation: string;
  eventCode: string;
  seasonYear: number;
  tournamentType: string;
  teamRanks: FMSQualRankTeam[] | null;
};
