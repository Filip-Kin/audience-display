import { writable } from "svelte/store";

/**
 * Client for the avatar-store service. Hand-made avatars are uploaded there per
 * team (plus an optional shared default); the display uses them in place of the
 * blurry 40px FMS avatar.
 *
 * Opt-in via VITE_AVATAR_STORE_URL (build time). When unset, no requests are
 * made and avatars render the raw FMS image / built-in placeholder (pixelated).
 *
 * We poll /avatars for the set of teams that have an upload plus each one's
 * version (file mtime); Avatar.svelte builds versioned URLs so a re-upload is a
 * fresh URL (instant update) while responses stay long-cached.
 */
const STORE = (import.meta.env.VITE_AVATAR_STORE_URL ?? "").replace(/\/$/, "");
const REFRESH_MS = 120_000;

export const avatarStoreUrl = STORE;

export type AvatarState = { teams: Map<number, number>; default: number | null };
export const avatarState = writable<AvatarState>({ teams: new Map(), default: null });

export function avatarUrl(team: number, version: number, size = 160): string {
  return `${STORE}/avatar/${team}.png?s=${size}&v=${version}`;
}

export function defaultAvatarUrl(version: number, size = 160): string {
  return `${STORE}/avatar/default.png?s=${size}&v=${version}`;
}

async function refresh(): Promise<void> {
  try {
    const res = await fetch(`${STORE}/avatars`, { cache: "no-store" });
    if (!res.ok) throw new Error(`avatar store responded ${res.status}`);
    const json = (await res.json()) as {
      teams?: Record<string, number>;
      default?: number | null;
    };
    const teams = new Map<number, number>();
    for (const [k, v] of Object.entries(json.teams ?? {})) teams.set(Number(k), v);
    avatarState.set({ teams, default: json.default ?? null });
  } catch (err) {
    console.error("avatar store list failed:", err);
  }
}

if (STORE) {
  refresh();
  setInterval(refresh, REFRESH_MS);
}
