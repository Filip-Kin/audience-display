import type { ProfileDefinition } from "../profiles/types";

export type AnimationKey =
  | "victoryRed"
  | "victoryBlue"
  | "victoryTie"
  | "bgIdle";

const KEY_FILES: Record<AnimationKey, string> = {
  victoryRed: "redwins.mp4",
  victoryBlue: "bluewins.mp4",
  victoryTie: "tie.mp4",
  bgIdle: "idle.mp4",
};

/**
 * Resolve an animation URL. Profiles may declare their own animation URLs via
 * `profile.animations[key]`. If not, fall back to the shipped default pack at
 * `/animations/default/<file>`.
 */
export function packUrl(profile: ProfileDefinition, key: AnimationKey): string {
  const override = profile.animations?.[key];
  if (override) return override;
  return `/animations/default/${KEY_FILES[key]}`;
}

export function defaultPackUrl(key: AnimationKey): string {
  return `/animations/default/${KEY_FILES[key]}`;
}

/**
 * Resolve the still-frame cover shown while a victory video buffers. Falls back
 * to the stock cover that matches the default `/animations/default/*` videos.
 */
export function coverUrl(profile: ProfileDefinition): string {
  return profile.animations?.cover ?? "/animations/first-frame.png";
}

// Held so the decoded cover stays in memory while the profile is active.
let preloadedCover: HTMLImageElement | null = null;

/**
 * Fetch and decode the profile's cover ahead of the first score reveal. The
 * cover <img> only mounts when a reveal starts, so without this the first
 * reveal after a page load shows a blank frame while the PNG downloads.
 */
export function preloadCover(profile: ProfileDefinition): void {
  const url = coverUrl(profile);
  if (preloadedCover?.getAttribute("src") === url) return;
  const img = new Image();
  img.src = url;
  img.decode().catch(() => {});
  preloadedCover = img;
}
