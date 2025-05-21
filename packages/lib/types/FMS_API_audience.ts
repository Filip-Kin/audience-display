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
  teamNumber: number,
  teamName: string,
  teamRank: number,
  avatar: string,
  carryingCard: boolean;
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