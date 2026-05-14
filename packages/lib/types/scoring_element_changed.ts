export type RobotAutoClimbType = "Unknown" | "None" | "Level1";

export type RobotEndGameType =
  | "Unknown"
  | "None"
  | "Level1"
  | "Level2"
  | "Level3";

export type ScoringElementChangedData = {
  AutoClimbData: {
    Robot1: RobotAutoClimbType;
    Robot2: RobotAutoClimbType;
    Robot3: RobotAutoClimbType;
  };

  EndgameClimbData: {
    Robot1: RobotEndGameType;
    Robot2: RobotEndGameType;
    Robot3: RobotEndGameType;
  };

  GoalCountData: {
    Hub: number;
  };

  ChangeSourceIsPLC: boolean;
};
