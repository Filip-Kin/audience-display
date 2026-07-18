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
  CoopFuelPoints: number; // FMS naming for transition-shift points
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

/**
 * Match phases as they appear on the wire (verified against fms-capture/signalr.jsonl):
 * FMS sends "Coop" for the transition shift, never "TransitionShift", and never
 * sends "PreMatch"/"PostMatch" (idle is "None"). The display normalizes "Coop"
 * to its internal MatchPhase "TransitionShift".
 */
export type FMSWireMatchPhase =
  | "None"
  | "Auto"
  | "Coop"
  | "Shift1"
  | "Shift2"
  | "Shift3"
  | "Shift4"
  | "Endgame";

export type GameSpecificMessage = {
  MatchPhase: FMSWireMatchPhase;
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
