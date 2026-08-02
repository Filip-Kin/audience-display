import type { ComponentType } from "svelte";
import type { Screen, ProfileTheme, ProfileAssets } from "lib";

export type ProfileDefinition = {
  id: string;
  name: string;
  eventName?: string;
  /**
   * TBA-style event code (e.g. "2026rr") used to fetch event-specific avatars
   * from the avatar store. Set this on offseason/custom profiles that have no
   * real FMS event code. When omitted, the code is derived from the live FMS
   * event (season + event code, e.g. 2026 + "MIRR" -> "2026mirr").
   */
  eventCode?: string;
  /**
   * Event information URL encoded into the schedule screen's QR code. Omit to
   * show the game logo panel instead of a QR on the schedule screen.
   */
  eventInfoUrl?: string;
  screens: Partial<Record<Screen, ComponentType>>;
  theme: ProfileTheme;
  assets: ProfileAssets;
  /**
   * Settings defaults this profile prefers (e.g. RR auto-switches to the
   * waiting screen 3s after the match ends). Applied when the profile becomes
   * active, but NEVER over a value the operator pinned via URL parameter.
   */
  settingsDefaults?: {
    transitionAfterMatchEnd?: number;
  };
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
  /**
   * Opt-in per-profile display tweaks to the shared default screens. Omit for
   * the plain default look; a profile sets only the flags it wants.
   */
  options?: {
    /**
     * Match-preview: render each alliance's name on a full-width red/blue bar
     * (matching the team-card width) instead of plain white text. Makes the
     * red/blue alliance obvious at a glance. Off by default.
     */
    allianceNameBackground?: boolean;
    /**
     * Score-reveal: how many milliseconds before the victory video ends to start
     * opening the shutter onto the results screen. Defaults to 500ms.
     */
    victoryRevealLeadMs?: number;
  };
};
