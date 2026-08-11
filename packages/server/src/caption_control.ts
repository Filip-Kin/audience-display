import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { Screen } from "lib";
import { appDataDir } from "./fms_logger";

// Drives the EXTERNAL live-captions overlay (FIRSTinMI/live-captions) so its
// captions land in a sensible spot for whatever screen the audience display is
// showing. The audience display is the brain: on every screen change it POSTs
// the target position to live-captions' tRPC `config.set` (which live-captions
// applies live via its config-changed event). live-captions itself knows
// nothing about this display - it just gained two generic position presets.
//
// User-facing on/off switch lives in the settings gear (like FMS logging),
// persisted in appdata. OFF by default (opt-in), and never lets a caption
// outage affect the display (all POSTs are fire-and-forget).

const settingsPath = () => join(appDataDir(), "settings.json");

function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(settingsPath(), "utf-8"));
  } catch {
    return {};
  }
}

function mergeSettings(patch: Record<string, unknown>): void {
  try {
    mkdirSync(appDataDir(), { recursive: true });
    writeFileSync(settingsPath(), JSON.stringify({ ...readSettings(), ...patch }, null, 2));
  } catch {
    // Not persisted; still applies for this run.
  }
}

// Default ON: the WRC feedback was captions covering the match info, and the
// most likely cause was this simply never being switched on. A venue can still
// turn it off in Settings (persists to settings.json captionControl:false).
let enabled = true;
// Where the display's score bar sits. Captions go on the OPPOSITE edge on the
// score-bar screens so they never cover it. Advanced (settings.json only).
let scorebarAtTop = false;
// live-captions base URL. Defaults to the same machine; override for a separate
// caption PC via settings.json `captionServerUrl` or the LIVE_CAPTIONS_URL env.
let serverUrl = "http://localhost:3000";
let lastPosted: number | null = null;

export function initCaptionControl(): void {
  const s = readSettings();
  if (typeof s.captionControl === "boolean") enabled = s.captionControl;
  if (typeof s.captionScorebarAtTop === "boolean") scorebarAtTop = s.captionScorebarAtTop;
  if (typeof s.captionServerUrl === "string" && s.captionServerUrl) serverUrl = s.captionServerUrl;
  if (process.env.LIVE_CAPTIONS_URL) serverUrl = process.env.LIVE_CAPTIONS_URL;
}

export function isCaptionControlEnabled(): boolean {
  return enabled;
}

export function setCaptionControlEnabled(on: boolean): void {
  enabled = on;
  lastPosted = null; // force a resync of the current screen on re-enable
  mergeSettings({ captionControl: on });
}

/**
 * live-captions position preset for a screen.
 * 0 = bottom (default). 4 = just under a top bar. 5 = just over a bottom bar.
 * Only the LIVE-match score-bar screens sit opposite the score bar; the
 * waiting-for-scores (match-end) and scores-ready screens show the gear/waiting
 * layout (no score bar), so their captions sit at the bottom like everything else.
 */
function screenToPosition(screen: Screen): number {
  const isScoreBar =
    screen.startsWith("match-") && screen !== "match-preview" && screen !== "match-end";
  if (isScoreBar) return scorebarAtTop ? 5 : 4;
  return 0;
}

/**
 * Tell live-captions where to render for the current screen. Deduped so it only
 * POSTs when the target position actually changes (called from broadcastState,
 * which also fires on the idle heartbeat). Fire-and-forget.
 */
export function syncCaptionScreen(screen: Screen): void {
  if (!enabled) return;
  const position = screenToPosition(screen);
  if (position === lastPosted) return;
  lastPosted = position;
  fetch(`${serverUrl}/trpc/config.set`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "display.position", value: String(position) }),
  }).catch(() => {
    // Caption server unreachable; clear so the next screen change retries.
    lastPosted = null;
  });
}
