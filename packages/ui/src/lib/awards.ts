import type { AudienceDisplayState, Award, BracketData } from "lib";

/** Name and FMS avatar for an award winner, from whatever the display already
 *  holds: the Team Names override first, then the names FMS has sent. */
export function awardTeamInfo(s: AudienceDisplayState, team: number): { name: string; avatar?: string } {
  const override = s.teamNames?.find((t) => t.number === team)?.name;
  const fms = s.fmsTeams?.find((t) => t.number === team)?.name;
  const ranked = s.rankData?.find((t) => t.teamNumber === team);
  const avatar =
    s.ranking?.find((t) => t.number === team)?.avatar || ranked?.avatar || undefined;
  return { name: override || fms || ranked?.teamName || "", avatar };
}

/** The teams of a playoff alliance, captain first, from the bracket data. */
function allianceTeams(bracket: BracketData, allianceNumber: number): number[] {
  const a = bracket.alliances.find((x) => x.allianceNumber === allianceNumber);
  if (!a) return [];
  return [a.captainTeamNumber, a.firstRoundTeamNumber, a.secondRoundTeamNumber, a.alternateTeamNumber].filter(
    (n) => Number.isInteger(n) && n > 0
  );
}

/** Winner and Finalist teams from a finished final, or null while the final is
 *  still being played. */
export function finalsResult(bracket: BracketData | null): { winner: number[]; finalist: number[] } | null {
  const f = bracket?.finals;
  if (!bracket || !f || !f.isComplete || !f.winningAllianceNumber) return null;
  const loser = f.winningAllianceNumber === f.redAllianceNumber ? f.blueAllianceNumber : f.redAllianceNumber;
  if (!loser) return null;
  return { winner: allianceTeams(bracket, f.winningAllianceNumber), finalist: allianceTeams(bracket, loser) };
}

// crypto.randomUUID only exists in a secure context, and the Awards page is
// usually opened over plain http from another machine on the LAN.
function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function newAward(partial: Partial<Award> = {}): Award {
  return { id: newId(), name: "", tbaType: null, winners: [{}], ...partial };
}
