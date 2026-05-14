import type { EventConfig } from "lib";

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
 * Resolve a URL for a named animation. Three-tier resolution:
 *
 * 1. If `eventConfig.animationPack` starts with "./" or contains "/", it's
 *    treated as a path relative to the active config directory (served at
 *    `/configs/<rel>/<file>`).
 * 2. Otherwise the pack is resolved against the shipped public packs at
 *    `/animations/<name>/<file>`.
 * 3. Callers should set `<video>.onerror` to fall back to the default pack
 *    via `defaultPackUrl(key)` for missing-file resilience.
 */
export function packUrl(
  config: EventConfig | null,
  activeConfigName: string | null,
  key: AnimationKey
): string {
  const fileName = KEY_FILES[key];
  if (!config) return defaultPackUrl(key);

  const pack = config.animationPack;
  if (pack.startsWith("./") || pack.includes("/")) {
    const stripped = pack.replace(/^\.\//, "");
    if (activeConfigName) {
      return `/configs/${activeConfigName}/${stripped}/${fileName}`;
    }
    return `/configs/${stripped}/${fileName}`;
  }
  return `/animations/${pack}/${fileName}`;
}

export function defaultPackUrl(key: AnimationKey): string {
  return `/animations/default/${KEY_FILES[key]}`;
}
