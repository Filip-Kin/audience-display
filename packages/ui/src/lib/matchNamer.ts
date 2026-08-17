import type { MatchType } from "lib";

// Playoff names are two short lines (bracket, then round + match): the "\n" is an
// explicit break rendered where the label uses `white-space: pre-line`, so a name
// never wraps to three lines or breaks on a hyphen. A middle dot (not a hyphen)
// joins round + match on the second line.
const bracket = {
  1: "Upper Bracket\nRound 1 · Match 1",
  2: "Upper Bracket\nRound 1 · Match 2",
  3: "Upper Bracket\nRound 1 · Match 3",
  4: "Upper Bracket\nRound 1 · Match 4",
  5: "Lower Bracket\nRound 2 · Match 5",
  6: "Lower Bracket\nRound 2 · Match 6",
  7: "Upper Bracket\nRound 2 · Match 7",
  8: "Upper Bracket\nRound 2 · Match 8",
  9: "Lower Bracket\nRound 3 · Match 9",
  10: "Lower Bracket\nRound 3 · Match 10",
  11: "Upper Bracket\nRound 4 · Match 11",
  12: "Lower Bracket\nRound 4 · Match 12",
  13: "Lower Bracket\nRound 5 · Match 13",
  14: "Final 1",
  15: "Final 2",
  16: "Final Tiebreaker",
  17: "Overtime 1",
  18: "Overtime 2",
  19: "Overtime 3",
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
  if (level === "f") {
    // FMS numbers finals 14-16 (17-19 overtime) continuing the double-elim
    // sequence, matching the table above. Fall back for anything else.
    if (matchNumber in bracket) {
      return bracket[matchNumber as keyof typeof bracket];
    }
    return `Final ${matchNumber}`;
  }
};

export function displayEventName(name?: string): string {
  if (!name) return "Event Name";
  if (name.length > 35) return name.slice(0, 35) + "...";
  return name;
}