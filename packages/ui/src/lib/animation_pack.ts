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
