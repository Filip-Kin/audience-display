export type AuxIOConfigType = "NotInUse" | "RedSpare" | "BlueSpare";

export type GameConfig = {
  traversalThreshold: number;
  energizedThreshold: number;
  superchargedThreshold: number;
  coopShiftLengthSeconds: number;
  shift1LengthSeconds: number;
  shift2LengthSeconds: number;
  shift3LengthSeconds: number;
  shift4LengthSeconds: number;
  endgameLengthSeconds: number;
  postMatchScoringDelayMilliseconds: number;
  spareCounterBox: AuxIOConfigType;
};
