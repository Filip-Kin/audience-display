import type { MatchType } from "lib";

const bracket = {
  1: "Upper Bracket - Round 1 - Match 1",
  2: "Upper Bracket - Round 1 - Match 2",
  3: "Upper Bracket - Round 1 - Match 3",
  4: "Upper Bracket - Round 1 - Match 4",
  5: "Lower Bracket - Round 2 - Match 5",
  6: "Lower Bracket - Round 2 - Match 6",
  7: "Upper Bracket - Round 2 - Match 7",
  8: "Upper Bracket - Round 2 - Match 8",
  9: "Lower Bracket - Round 3 - Match 9",
  10: "Lower Bracket - Round 3 - Match 10",
  11: "Upper Bracket - Round 4 - Match 11",
  12: "Lower Bracket - Round 4 - Match 12",
  13: "Lower Bracket - Round 5 - Match 13",
};

export const matchName = (
  matchNumber: number,
  totalMatches: number,
  level: MatchType,
) => {
  if (level === "q") {
    return `Qualification ${matchNumber} of ${totalMatches}`;
  }
  if (level === "p") {
    return `Practice Match ${matchNumber} of ${totalMatches}`;
  }
  if (level === "t") {
    return `Test Match`;
  }
  if (level === "sf") {
    if (matchNumber in bracket) {
      return bracket[matchNumber as keyof typeof bracket];
    }
  }
};
