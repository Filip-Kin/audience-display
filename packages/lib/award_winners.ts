import type { Award, AwardWinner } from "./types/awards";

/** The winners actually filled in. The Awards page keeps empty winner slots
 *  (a fresh award starts with one), so everything that shows or sends winners
 *  goes through this. */
export function filledWinners(award: Award): AwardWinner[] {
  return award.winners.filter((w) => w.team || w.person);
}
