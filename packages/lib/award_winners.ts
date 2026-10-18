import type { Award, AwardWinner } from "./types/awards";

/** The winners actually filled in. The Awards page keeps empty winner slots
 *  (a fresh award starts with one), so everything that shows or sends winners
 *  goes through this. */
export function filledWinners(award: Award): AwardWinner[] {
  return award.winners.filter((w) => w.team || w.person);
}

export type TbaAwardEntry = { name_str: string; type_enum: number; team_key: string | null; awardee: string | null };

/** One award's entries in TBA's trusted awards body: one per recipient, all
 *  sharing the award's type and name. Empty when it cannot go to TBA (no type,
 *  no name, or no winners). */
export function tbaEntries(award: Award): TbaAwardEntry[] {
  if (award.tbaType === null || !award.name) return [];
  return filledWinners(award).map((w) => ({
    name_str: award.name,
    type_enum: award.tbaType as number,
    team_key: w.team ? `frc${w.team}` : null,
    awardee: w.person ?? null,
  }));
}

/** What TBA holds for this award once published. Compared with the award's
 *  `publishedSig` to tell an award edited since it was published. */
export function tbaSig(award: Award): string {
  return JSON.stringify(tbaEntries(award));
}
