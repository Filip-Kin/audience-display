import type {
  AllianceScore,
  ScoreChangedData,
  GameConfig,
} from "lib";
import type { AllianceScoreDetails } from "lib/types/FMS_API_audience";

export function emptyAllianceScore(): AllianceScore {
  return {
    score: 0,
    autoFuelPoints: 0,
    teleopFuelPoints: 0,
    coopFuelPoints: 0,
    shiftFuelPoints: [0, 0, 0, 0],
    endgameFuelPoints: 0,
    totalFuelPoints: 0,
    teleopFuelCount: 0,
    totalFuelCount: 0,
    autoClimbPoints: 0,
    endgameClimbPoints: 0,
    totalClimbPoints: 0,
    energizedAchieved: false,
    superchargedAchieved: false,
    traversalAchieved: false,
    advantageAchieved: null,
    coopertitionAchieved: false,
    energizedThreshold: 0,
    superchargedThreshold: 0,
    traversalThreshold: 0,
    rankingPoints: 0,
    foulPoints: 0,
    adjustPoints: 0,
    penalties: { g206: false, g418: false, g419: false },
    isHighScore: false,
  };
}

export function mapLiveScore(data: ScoreChangedData): AllianceScore {
  return {
    score: data.TotalPoints,
    autoFuelPoints: data.AutoFuelPoints,
    teleopFuelPoints: data.TeleopFuelPoints,
    coopFuelPoints: data.CoopFuelPoints,
    shiftFuelPoints: [
      data.Shift1FuelPoints,
      data.Shift2FuelPoints,
      data.Shift3FuelPoints,
      data.Shift4FuelPoints,
    ],
    endgameFuelPoints: data.EndgameFuelPoints,
    totalFuelPoints: data.TotalFuelPoints,
    teleopFuelCount: data.TeleopFuelCount,
    totalFuelCount: data.TotalFuelCount,
    autoClimbPoints: data.AutoClimbPoints,
    endgameClimbPoints: data.EndgameClimbPoints,
    totalClimbPoints: data.TotalClimbPoints,
    energizedAchieved: data.EnergizedAchieved,
    superchargedAchieved: data.SuperchargedAchieved,
    traversalAchieved: data.TraversalAchieved,
    advantageAchieved: data.AdvantageAchieved,
    coopertitionAchieved: false, // coop is announced at result time
    energizedThreshold: data.EnergizedThreshold,
    superchargedThreshold: data.SuperchargedThreshold,
    traversalThreshold: data.TraversalThreshold,
    rankingPoints: computeLiveRankingPoints({
      energized: data.EnergizedAchieved,
      supercharged: data.SuperchargedAchieved,
      traversal: data.TraversalAchieved,
    }),
    foulPoints: data.FoulPoints,
    adjustPoints: data.AdjustPoints,
    penalties: {
      g206: data.G206Penalty,
      g418: data.G418Penalty,
      g419: data.G419Penalty,
    },
    isHighScore: false,
  };
}

export function mapResultScore(
  details: AllianceScoreDetails,
  coopertitionAchieved: boolean,
  cachedAdvantage: boolean | null,
  thresholds: { energized: number; supercharged: number; traversal: number }
): AllianceScore {
  return {
    score: details.totalScore,
    autoFuelPoints: details.autoFuelPoints,
    teleopFuelPoints: details.teleopFuelPoints,
    coopFuelPoints: 0,
    shiftFuelPoints: [0, 0, 0, 0],
    endgameFuelPoints: 0,
    totalFuelPoints: details.autoFuelPoints + details.teleopFuelPoints,
    teleopFuelCount: 0,
    totalFuelCount: 0,
    autoClimbPoints: details.autoClimbPoints,
    endgameClimbPoints: details.teleopClimbPoints,
    totalClimbPoints: details.autoClimbPoints + details.teleopClimbPoints,
    energizedAchieved: details.energizedAchieved,
    superchargedAchieved: details.superchargedAchieved,
    traversalAchieved: details.traversalAchieved,
    advantageAchieved: cachedAdvantage,
    coopertitionAchieved: coopertitionAchieved,
    energizedThreshold: thresholds.energized,
    superchargedThreshold: thresholds.supercharged,
    traversalThreshold: thresholds.traversal,
    rankingPoints: details.rankingPoints,
    foulPoints: details.penaltyPoints,
    adjustPoints: 0,
    penalties: { g206: false, g418: false, g419: false },
    isHighScore: details.isHighScore,
  };
}

function computeLiveRankingPoints(flags: {
  energized: boolean;
  supercharged: boolean;
  traversal: boolean;
}): number {
  return (
    (flags.energized ? 1 : 0) +
    (flags.supercharged ? 1 : 0) +
    (flags.traversal ? 1 : 0)
  );
}

export function defaultGameConfig(): GameConfig {
  return {
    traversalThreshold: 50,
    energizedThreshold: 100,
    superchargedThreshold: 360,
    coopShiftLengthSeconds: 10,
    shift1LengthSeconds: 25,
    shift2LengthSeconds: 25,
    shift3LengthSeconds: 25,
    shift4LengthSeconds: 25,
    endgameLengthSeconds: 30,
    postMatchScoringDelayMilliseconds: 5000,
    spareCounterBox: "NotInUse",
  };
}
