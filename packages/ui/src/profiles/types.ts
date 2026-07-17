import type { ComponentType } from "svelte";
import type { Screen, ProfileTheme, ProfileAssets } from "lib";

export type ProfileDefinition = {
  id: string;
  name: string;
  eventName?: string;
  screens: Partial<Record<Screen, ComponentType>>;
  theme: ProfileTheme;
  assets: ProfileAssets;
  animations?: {
    victoryRed?: string;
    victoryBlue?: string;
    victoryTie?: string;
    bgIdle?: string;
    /**
     * Still frame shown while a victory video buffers. Should be the first
     * frame of THIS profile's victory videos. Omit to use the stock cover that
     * matches the default `/animations/default/*` videos.
     */
    cover?: string;
  };
};
