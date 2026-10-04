import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { appDataDir } from './fms_logger';
import type { TeamNameEntry } from 'lib/types/audience_display';

// Team name overrides live in settings.json under `teamNames`, keyed by profile
// id: { "teamNames": { "marc": [{ "number": 9993, "name": "Tung Tung Turret" }] } }.
// Keying by profile is the point. A B-team name set for one event must not
// follow the laptop to the next event, and every event runs its own profile.
// Edited from the Settings dialog; this module is the only writer of the key.

// #region settings.json persistence
const settingsPath = () => join(appDataDir(), 'settings.json');

function readSettings(): Record<string, unknown> {
    try {
        return JSON.parse(readFileSync(settingsPath(), 'utf-8'));
    } catch {
        return {};
    }
}

function mergeSettings(patch: Record<string, unknown>): void {
    try {
        mkdirSync(appDataDir(), { recursive: true });
        writeFileSync(settingsPath(), JSON.stringify({ ...readSettings(), ...patch }, null, 2));
    } catch {
        // Not persisted; still applies for this run.
    }
}
// #endregion

let byProfile: Record<string, TeamNameEntry[]> = {};
let activeProfile: () => string = () => 'default';

/** The name FMS sent for each team, kept so an override removed in Settings can
 *  fall back to it on screens already showing. Alliance selection carries the
 *  short name and every other DTO the full one, so the two are kept apart. */
const fmsNames = { long: new Map<number, string>(), short: new Map<number, string>() };
export type NameKind = keyof typeof fmsNames;

export function initTeamNames(getProfileId: () => string): void {
    activeProfile = getProfileId;
    const raw = readSettings().teamNames;
    byProfile = raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, TeamNameEntry[]>)
        : {};
}

/** The active profile's overrides, for the Settings dialog. */
export function listTeamNames(): TeamNameEntry[] {
    const list = byProfile[activeProfile()];
    return Array.isArray(list) ? list : [];
}

/** The name FMS last sent for a team, or undefined if none has come in yet. */
export function getFmsName(teamNumber: number, kind: NameKind = 'long'): string | undefined {
    return fmsNames[kind].get(teamNumber);
}

export function getTeamName(teamNumber: number, defaultName: string, kind: NameKind = 'long'): string {
    if (defaultName) fmsNames[kind].set(teamNumber, defaultName);
    const match = listTeamNames().find(t => t.number === teamNumber);
    return match?.name || defaultName;
}

/** Optional alternate designation (e.g. "1502B") to show next to a team number.
 *  Undefined when none is set. */
export function getTeamDesignation(teamNumber: number): string | undefined {
    const match = listTeamNames().find(t => t.number === teamNumber);
    return match?.designation || undefined;
}

/** Replace the active profile's override list (the Settings dialog sends it
 *  complete). Rows without a positive team number, or with neither a name nor
 *  a designation, are dropped; a later row for the same number wins. */
export function saveTeamNames(entries: unknown): TeamNameEntry[] {
    const byNumber = new Map<number, TeamNameEntry>();
    for (const e of Array.isArray(entries) ? entries : []) {
        const number = Number(e?.number);
        if (!Number.isInteger(number) || number <= 0) continue;
        const name = typeof e?.name === 'string' ? e.name.trim() : '';
        const designation = typeof e?.designation === 'string' ? e.designation.trim() : '';
        if (!name && !designation) continue;
        byNumber.set(number, {
            number,
            ...(name ? { name } : {}),
            ...(designation ? { designation } : {}),
        });
    }
    const teams = [...byNumber.values()].sort((a, b) => a.number - b.number);
    const next = { ...byProfile };
    if (teams.length) next[activeProfile()] = teams;
    else delete next[activeProfile()];
    byProfile = next;
    mergeSettings({ teamNames: byProfile });
    return teams;
}
