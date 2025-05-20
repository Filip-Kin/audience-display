export type ScoringElementChangedData = {
  AutoRobotData: {
    Robot1: "Unknown" | "No" | "Yes";
    Robot2: "Unknown" | "No" | "Yes";
    Robot3: "Unknown" | "No" | "Yes";
  };

  EndgameRobotData: {
    Robot1: "Unknown" | "None" | "Parked" | "ShallowCage" | "DeepCage";
    Robot2: "Unknown" | "None" | "Parked" | "ShallowCage" | "DeepCage";
    Robot3: "Unknown" | "None" | "Parked" | "ShallowCage" | "DeepCage";
  };

  AutoReefNodeData: Record<ReefNodeKey, boolean>;
  TeleopReefNodeData: Record<ReefNodeKey, boolean>;

  GoalCountData: {
    Net: number;
    Wall: number;
    AutoReefTrough: number;
    TeleopReefTrough: number;
  };

  ChangeSourceIsPLC: boolean;
};

type ReefNodeKey =
  | `BotRow_Node${NodeLabel}`
  | `MidRow_Node${NodeLabel}`
  | `TopRow_Node${NodeLabel}`;

type NodeLabel =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";
