import type { MatchType } from "lib";

// A match name is SEGMENTS, not a pre-formatted string, because the right shape
// depends on the box it lands in. A wide box (the top bar) joins them with a
// space; a narrow one (the Up Next card, the preview chip) stacks one per line.
// Each renderer decides - see matchNameParts vs matchName below.
//
// This used to be one string with " - " between the segments and each box chose
// whether to split on it. 2c1aa86 replaced that with a hard "\n" so playoff names
// could never wrap to three lines or break on a hyphen, which fixed the reveal but
// took the choice away from every other box and left Timeout's " - " splitter dead.
// Segments give back the per-box decision without ever putting a hyphen on screen.
//
// A middle dot (not a hyphen) joins round + match inside the second segment.
const bracket = {
  1: ["Upper Bracket", "Round 1 · Match 1"],
  2: ["Upper Bracket", "Round 1 · Match 2"],
  3: ["Upper Bracket", "Round 1 · Match 3"],
  4: ["Upper Bracket", "Round 1 · Match 4"],
  5: ["Lower Bracket", "Round 2 · Match 5"],
  6: ["Lower Bracket", "Round 2 · Match 6"],
  7: ["Upper Bracket", "Round 2 · Match 7"],
  8: ["Upper Bracket", "Round 2 · Match 8"],
  9: ["Lower Bracket", "Round 3 · Match 9"],
  10: ["Lower Bracket", "Round 3 · Match 10"],
  11: ["Upper Bracket", "Round 4 · Match 11"],
  12: ["Lower Bracket", "Round 4 · Match 12"],
  13: ["Lower Bracket", "Round 5 · Match 13"],
  14: ["Final 1"],
  15: ["Final 2"],
  16: ["Final Tiebreaker"],
  17: ["Overtime 1"],
  18: ["Overtime 2"],
  19: ["Overtime 3"],
};

/**
 * The segments of a match name, outermost first: ["Qualification", "1 of 30"],
 * ["Upper Bracket", "Round 1 · Match 1"], ["Test Match"].
 *
 * Use this in a NARROW box and render one segment per line. Use matchName() in a
 * box with room for the whole thing on one line.
 */
export const matchNameParts = (
  matchNumber: number,
  totalMatches: number,
  level: MatchType,
): string[] => {
  if (level === "q") return ["Qualification", `${matchNumber} of ${totalMatches}`];
  if (level === "p") return ["Practice Match", `${matchNumber} of ${totalMatches}`];
  if (level === "t") return ["Test Match"];
  if (level === "sf" || level === "f") {
    if (matchNumber in bracket) return bracket[matchNumber as keyof typeof bracket];
    // FMS numbers finals 14-16 (17-19 overtime) continuing the double-elim
    // sequence, matching the table above. Fall back for anything else.
    if (level === "f") return [`Final ${matchNumber}`];
  }
  return [];
};

/** The one-line form. Undefined for an unknown playoff number, as before. */
export const matchName = (
  matchNumber: number,
  totalMatches: number,
  level: MatchType,
): string | undefined => {
  const parts = matchNameParts(matchNumber, totalMatches, level);
  return parts.length ? parts.join(" ") : undefined;
};

export function displayEventName(name?: string): string {
  if (!name) return "Event Name";
  if (name.length > 35) return name.slice(0, 35) + "...";
  return name;
}