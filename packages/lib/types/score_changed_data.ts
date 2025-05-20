export type ScoreChangedData = {
  AutoPoints: number;
  TeleopPoints: number;
  AdjustPoints: number;
  FoulPoints: number;
  TotalPoints: number;
  TimeStamp: Date;

  AutoMobilityPoints: number;
  AutoMobilityRobotCount: number;
  AutoMobilityThreshold: number;

  TotalCoralCount: number;
  TopRowCoralCount: number;
  MidRowCoralCount: number;
  BotRowCoralCount: number;
  TroughCoralCount: number;

  AutoCoralCount: number;
  TeleopCoralCount: number;
  TotalCoralPoints: number;
  AutoCoralPoints: number;
  TeleopCoralPoints: number;

  EndgameBargePoints: number;

  AlgaePoints: number;
  AlgaeCount: number;
  ReefLevelsCount: number;

  CoopertitionCriteriaMet: boolean;
  CoopertitionBonusAchieved: boolean;
  CoralBonusAchieved: boolean;
  AutoBonusAchieved: boolean;
  BargeBonusAchieved: boolean;

  BargeBonusThreshold: number;
  CoralBonusLevelsThreshold: number;
  CoralBonusCoralThreshold: number;
  AutoBonusCoralThreshold: number;

  G206Penalty: boolean;
  G410Penalty: boolean;
  G418Penalty: boolean;
  G419Penalty: boolean;
  G428Penalty: boolean;
};
