/**
 * Server-readable index of every display profile: id, name and the FMS event
 * codes the profile belongs to. The UI profiles in packages/ui/src/profiles
 * take their `id`, `name` and `eventCodes` from here (`...profileMeta("<id>")`),
 * so this is the one place those three live. The server imports it to pick a
 * profile from the FMS event code and to name profiles in /api/events.
 *
 * `eventCodes` are FMS event codes as FMS reports them (e.g. "MIBIG1"), NOT the
 * TBA-style `eventCode` a UI profile sets for the avatar store. Matching is
 * case-insensitive. Only list a code that is known for certain: offseason venue
 * FMS installs often still carry an earlier event, and a wrong code here makes
 * the display switch itself to the wrong branding.
 */
export type ProfileMeta = {
  id: string;
  name: string;
  eventCodes?: string[];
};

export const PROFILE_INDEX = {
  default: { id: "default", name: "Default (Red + Blue)" },
  wrc: { id: "wrc", name: "WRC (Wolverine Robotics Competition)" },
  "rainbow-rumble": { id: "rainbow-rumble", name: "Rainbow Rumble" },
  marc: { id: "marc", name: "MARC (Pit Podcast)" },
  // FIRST's code for Ferris State Roboday (frc-events.firstinspires.org/2026/MIBIG1).
  "fsu-roboday": { id: "fsu-roboday", name: "Ferris State Roboday", eventCodes: ["MIBIG1"] },
  "grand-rapids-girls": {
    id: "grand-rapids-girls",
    name: "Grand Rapids Girls Robotics Competition",
  },
  goonettes: { id: "goonettes", name: "Goonettes Invitational" },
  bgrc: { id: "bgrc", name: "BGRC (Bloomfield Girls Robotics Competition)" },
  c3: { id: "c3", name: "C3 (Cullen's Cancer Clash)" },
} satisfies Record<string, ProfileMeta>;

export type ProfileId = keyof typeof PROFILE_INDEX;

/** id + name + eventCodes for a UI profile definition to spread in. */
export function profileMeta(id: ProfileId): ProfileMeta {
  const m: ProfileMeta = PROFILE_INDEX[id];
  return { id: m.id, name: m.name, ...(m.eventCodes ? { eventCodes: [...m.eventCodes] } : {}) };
}

export function listProfileMeta(): ProfileMeta[] {
  return Object.values(PROFILE_INDEX);
}

export function profileName(id: string): string {
  return (PROFILE_INDEX as Record<string, ProfileMeta>)[id]?.name ?? id;
}

/**
 * The one profile that lists this FMS event code (case-insensitive), or null
 * when none or more than one does. An ambiguous code selects nothing.
 */
export function profileIdForEventCode(
  code: string | null | undefined,
  profiles: ProfileMeta[] = listProfileMeta()
): string | null {
  const wanted = code?.trim().toUpperCase();
  if (!wanted) return null;
  const hits = profiles.filter((p) =>
    (p.eventCodes ?? []).some((c) => c.trim().toUpperCase() === wanted)
  );
  return hits.length === 1 ? hits[0].id : null;
}
