/** One recipient of an award: a team, a person, or a person on a team
 *  (Dean's List, Woodie Flowers, Volunteer of the Year). */
export type AwardWinner = {
  team?: number;
  person?: string;
};

/**
 * An award as the operator defines it on the Awards page. Offseason events
 * hand out awards FMS has never heard of, so the list is ours; FMS awards are
 * not read.
 */
export type Award = {
  id: string;
  name: string;
  /**
   * The Blue Alliance award type the award is filed under (TBA's AwardType
   * enum, e.g. 1 = Winner). TBA keys awards by event + type, so a custom award
   * borrows an existing type and keeps its own name; two awards sharing a type
   * merge on TBA. Null = not pushed to TBA.
   */
  tbaType: number | null;
  /** Sponsor logo URL (a profile asset or an uploaded file under /award-logos/). */
  sponsor?: string;
  /** Sponsor logo is dark art that needs the white card behind it. */
  sponsorLight?: boolean;
  winners: AwardWinner[];
};

/** What the award lower third is showing. `award` is a copy taken when it was
 *  shown, so editing the list does not repaint a lower third already on air. */
export type AwardDisplay = {
  award: Award;
  revealed: boolean;
};

/** TBA trusted-API credentials, read from FIM-AV Assistant's upload settings
 *  when the display runs under it, or typed on the Awards page. The secret is
 *  never sent to the browser; only whether one is set. */
export type TbaCredentialsStatus = {
  eventKey: string;
  authId: string;
  hasSecret: boolean;
  source: "awards" | "fimav" | "none";
};
