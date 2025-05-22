export enum LevelParam {
  None,
  Practice,
  Qualification,
  Playoff,
  DoubleElimPlayoff,
  DoubleElimFinal
}

export interface FMSMatchPreview {
  matchNumber: number,
  matchDescription: string,
  numberOfPracticeMatches?: number;
  numberOfQualMatches?: number;
  numberOfPlayoffMatches?: number;
  eventName: string,
  tournamentType: string,
  redAlliance: FMSMatchPreviewAlliance,
  blueAlliance: FMSMatchPreviewAlliance;
}

export interface FMSMatchPreviewAlliance {
  team1: FMSMatchPreviewTeam,
  team2: FMSMatchPreviewTeam,
  team3: FMSMatchPreviewTeam;
}

export interface FMSMatchPreviewTeam {
  teamNumber: number;
  teamName: string;
  teamRank: number;
  avatar: string;
  cardCarryStatus: "None" | "Yellow" | "Red";
};

export interface FMSMatchResultsTeam extends FMSMatchPreviewTeam {
  teamRankChange: "Up" | "Down" | null;
  cardEffectiveStatus: "None" | "Yellow" | "Red";
}

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

export type FMSMatchScore = {
  matchNumber: number;
  numberOfQualMatches: number;
  matchDescription: string;
  eventName: string;
  eventCode: string;
  season: number;
  tournamentType: string;
  redAllianceData: FMSAllianceData;
  blueAllianceData: FMSAllianceData;
  matchWinner: "Red" | "Blue" | "Tie";
};

export type FMSAllianceData = {
  scoreDetails: AllianceScoreDetails;
  team1: FMSMatchResultsTeam;
  team2: FMSMatchResultsTeam;
  team3: FMSMatchResultsTeam;
};

export type AllianceScoreDetails = {
  win: boolean;
  tie: boolean;
  totalScore: number;
  isHighScore: boolean;
  autoMobilityPoints: number;
  coralPoints: number;
  algaePoints: number;
  bargePoints: number;
  penaltyPoints: number;
  autoBonusAchieved: boolean;
  coralBonusAchieved: boolean;
  bargeBonusAchieved: boolean;
  coopertitionAchieved: boolean;
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

  cardEffectiveStatus: "None" | "Yellow" | "Red";
};

export type FMSRankingTeam = {
  rank: number;
  teamNumber: number;
  inPotentialCaptainPosition: boolean;
};
