import { writable } from "svelte/store";

/**
 * Client for the avatar-store service. Hand-made avatars are uploaded there per
 * team (plus an optional shared default and per-event overrides); the display
 * uses them in place of the blurry 40px FMS avatar.
 *
 * Defaults to the public, permanently-hosted store; override at build time with
 * VITE_AVATAR_STORE_URL (set it to "" to disable and render the raw FMS image /
 * built-in placeholder, pixelated).
 *
 * We poll /avatars (scoped to the active event, if any) for the set of teams
 * that have a crisp upload plus each one's version (file mtime); Avatar.svelte
 * builds versioned URLs so a re-upload is a fresh URL (instant update) while
 * responses stay long-cached.
 */
const STORE = (import.meta.env.VITE_AVATAR_STORE_URL ?? "https://avatars.filipkin.com").replace(/\/$/, "");
const REFRESH_MS = 120_000;

export const avatarStoreUrl = STORE;

// The event we ask the store about (e.g. "2026mirr"). Pushed in from state.ts
// (setAvatarEvent) so this module stays dependency-free and cycle-free.
let currentEvent: string | null = null;

export type AvatarState = { teams: Map<number, number>; default: number | null };
export const avatarState = writable<AvatarState>({ teams: new Map(), default: null });

function eventParam(event: string | null): string {
  return event ? `&event=${encodeURIComponent(event)}` : "";
}

export function avatarUrl(
  team: number,
  version: number,
  size = 160,
  event: string | null = currentEvent,
): string {
  return `${STORE}/avatar/${team}.png?s=${size}&v=${version}${eventParam(event)}`;
}

export function defaultAvatarUrl(version: number, size = 160): string {
  return `${STORE}/avatar/default.png?s=${size}&v=${version}`;
}

async function refresh(): Promise<void> {
  try {
    const url = `${STORE}/avatars${currentEvent ? `?event=${encodeURIComponent(currentEvent)}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
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

/**
 * Set the event the store is scoped to (from the active profile or the live FMS
 * event code). Re-polls immediately when it changes so event-specific avatars
 * appear without waiting for the next interval.
 */
export function setAvatarEvent(event: string | null): void {
  const next = event || null;
  if (next === currentEvent) return;
  currentEvent = next;
  if (STORE) refresh();
}

if (STORE) {
  refresh();
  setInterval(refresh, REFRESH_MS);
}
