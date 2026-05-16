import type { ComponentType } from "svelte";
import type { Screen, ProfileTheme, ProfileAssets } from "lib";

export type ProfileDefinition = {
  id: string;
  name: string;
  screens: Partial<Record<Screen, ComponentType>>;
  theme: ProfileTheme;
  assets: ProfileAssets;
  animations?: {
    victoryRed?: string;
    victoryBlue?: string;
    victoryTie?: string;
    bgIdle?: string;
  };
};
