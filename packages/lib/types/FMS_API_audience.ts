export enum LevelParam {
    None,
    Practice,
    Qual,
    Playoff,
    DoubleElimPlayoff,
    DoubleElimFinal
}

export interface FMSMatchPreview {
    matchNumber: number,
    matchDescription: string,
    numberOfPracticeMatches?: number
    numberOfQualMatches?: number
    numberOfPlayoffMatches?: number
    eventName: string,
    tournamentType: string,
    redAlliance: FMSMatchPreviewAlliance,
    blueAlliance: FMSMatchPreviewAlliance
}

export interface FMSMatchPreviewAlliance {
    team1: FMSMatchPreviewTeam,
    team2: FMSMatchPreviewTeam,
    team3: FMSMatchPreviewTeam
}

export interface FMSMatchPreviewTeam {
    teamNumber: number,
    teamName: string,
    teamRank: number,
    avatar: string,
    carryingCard: boolean
}
