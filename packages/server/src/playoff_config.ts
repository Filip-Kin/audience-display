import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { appDataDir } from "./fms_logger";

// Number of REAL playoff alliances. A small offseason event can't fill 8
// alliances, so it runs the standard 8-alliance double elimination and
// backfills the empty seats with filler alliances (the seeds beyond this
// count) whose matches are foregone 1-0 forfeits. The bracket + alliance-
// selection screens collapse those away and show only the real matches.
// 8 (the default) means no fillers, so every normal event is unchanged.

let realAlliances = 8;

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 8;
  return Math.max(2, Math.min(8, Math.round(n)));
}

function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(join(appDataDir(), "settings.json"), "utf-8"));
  } catch {
    return {};
  }
}

function mergeSettings(patch: Record<string, unknown>): void {
  try {
    mkdirSync(appDataDir(), { recursive: true });
    writeFileSync(
      join(appDataDir(), "settings.json"),
      JSON.stringify({ ...readSettings(), ...patch }, null, 2)
    );
  } catch {
    // not persisted; still applies this run
  }
}

export function initPlayoffConfig(): void {
  const s = readSettings();
  if (typeof s.playoffRealAlliances === "number") realAlliances = clamp(s.playoffRealAlliances);
  if (process.env.PLAYOFF_REAL_ALLIANCES)
    realAlliances = clamp(Number(process.env.PLAYOFF_REAL_ALLIANCES));
}

export function getRealAlliances(): number {
  return realAlliances;
}

/** Set + persist the real playoff-alliance count (from the landing page). */
export function setRealAlliances(n: number): number {
  realAlliances = clamp(n);
  mergeSettings({ playoffRealAlliances: realAlliances });
  return realAlliances;
}
