export type MatchPhase =
  | "PreMatch"
  | "Auto"
  | "TransitionShift"
  | "Shift1"
  | "Shift2"
  | "Shift3"
  | "Shift4"
  | "Endgame"
  | "PostMatch";

export const SHIFT_PHASES = ["Shift1", "Shift2", "Shift3", "Shift4"] as const;
export type ShiftPhase = (typeof SHIFT_PHASES)[number];

export const PROGRESS_PHASES = [
  "Auto",
  "TransitionShift",
  "Shift1",
  "Shift2",
  "Shift3",
  "Shift4",
  "Endgame",
] as const satisfies readonly MatchPhase[];
export type ProgressPhase = (typeof PROGRESS_PHASES)[number];

export function isShiftPhase(phase: MatchPhase): phase is ShiftPhase {
  return SHIFT_PHASES.includes(phase as ShiftPhase);
}
