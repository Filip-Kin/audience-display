export type ScoreChangedData = {
  AdjustPoints: number;
  G206Penalty: boolean;
  G418Penalty: boolean;
  G419Penalty: boolean;
  TotalPoints: number;
  AutoPoints: number;
  TeleopPoints: number;
  FoulPoints: number;
  TimeStamp: Date;

  EnergizedAchieved: boolean;
  SuperchargedAchieved: boolean;
  TraversalAchieved: boolean;
  AdvantageAchieved: boolean;

  AutoFuelPoints: number;
  CoopFuelPoints: number;
  Shift1FuelPoints: number;
  Shift2FuelPoints: number;
  Shift3FuelPoints: number;
  Shift4FuelPoints: number;
  EndgameFuelPoints: number;
  TeleopFuelPoints: number;
  TotalFuelPoints: number;
  TeleopFuelCount: number;
  TotalFuelCount: number;

  AutoClimbPoints: number;
  EndgameClimbPoints: number;
  TotalClimbPoints: number;

  EnergizedThreshold: number;
  SuperchargedThreshold: number;
  TraversalThreshold: number;
};

export type GameSpecificMessage = {
  MatchPhase:
    | "None"
    | "PreMatch"
    | "Auto"
    | "TransitionShift"
    | "Shift1"
    | "Shift2"
    | "Shift3"
    | "Shift4"
    | "Endgame"
    | "PostMatch";
  BlueAllianceGoalActive: boolean;
  RedAllianceGoalActive: boolean;
  CurrentPhaseTimeSeconds: number;
  MessageType: "MatchPhaseChanged" | string;
};

export type PlcMatchStatusData = {
  FieldCleanup: boolean;
  ArenaClear: boolean;
  RefDone: boolean;
  RefUnderReview: boolean;
  BlueFouls: number;
  BlueFoulsTech: number;
  RedFouls: number;
  RedFoulsTech: number;
};
