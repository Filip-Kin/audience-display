import type { ComponentType } from "svelte";
import type { Screen } from "lib";
import type { ProfileDefinition } from "./types";
import defaultProfile from "./default";

const registry: Record<string, ProfileDefinition> = {
  [defaultProfile.id]: defaultProfile,
};

export const DEFAULT_PROFILE_ID = defaultProfile.id;

export type ProfileMeta = { id: string; name: string };

export function listProfiles(): ProfileMeta[] {
  return Object.values(registry).map((p) => ({ id: p.id, name: p.name }));
}

export function getProfile(id: string | null | undefined): ProfileDefinition {
  if (id && registry[id]) return registry[id];
  return defaultProfile;
}

export function resolveScreen(
  profileId: string | null | undefined,
  screen: Screen
): ComponentType | null {
  const profile = getProfile(profileId);
  const own = profile.screens[screen];
  if (own) return own;
  // Fall back to default profile's screen if this profile didn't override.
  if (profile.id !== defaultProfile.id) {
    const fallback = defaultProfile.screens[screen];
    if (fallback) return fallback;
  }
  return null;
}

export type { ProfileDefinition } from "./types";
