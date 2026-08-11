import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { MatchState, MatchType, Screen } from "lib";
import { appDataDir } from "./fms_logger";

// Bitfocus Companion integration. Mirrors what FIRST's official audience display
// does (press a Companion button on each match-state change, via Companion's 3.x
// HTTP API `POST /api/location/<page>/<row>/<column>/press`), and improves on it:
//  - fires an Endgame Start event the official offers but never triggers,
//  - drops the official's dead award events (we only expose events we fire),
//  - sets a RICH variable feed (scores, winner incl. TIE, teams, alliances,
//    match number/level/state) instead of the official's single match-name var,
//  - supports MULTIPLE sinks (e.g. a local Companion + the AV computer's).
// Wire-compatible: the match-name variable name is operator-configurable, so a
// setup already relying on the official's match-name variable keeps working (we
// just fill it with our own match namer).
//
// Config + on/off live on the server web UI (/bitfocus), persisted in appdata
// settings.json. Every network call is fire-and-forget: a dead/slow Companion
// never blocks or crashes the display.

// #region types
export interface CompanionButton {
  page: number;
  row: number;
  column: number;
}
export interface CompanionSink {
  id: string;
  label: string;
  /** Base URL incl. port, e.g. "http://127.0.0.1:8000" (Companion default 8000). */
  address: string;
  enabled: boolean;
  /** event id -> button location on THIS sink's Companion layout. */
  buttons: Record<string, CompanionButton>;
}
export interface CompanionConfig {
  /** Master on/off. */
  enabled: boolean;
  /** Also push the variable feed (not just button presses). */
  variablesEnabled: boolean;
  /** true = score variables update live through the match (still 1/sec throttled);
   *  false = score variables only update when results post (score reveal). */
  liveScores: boolean;
  sinks: CompanionSink[];
}

/** Only events we actually detect + fire (no dead options like the official's
 *  "Endgame Start" / award events). Order = display order in the config UI. */
export const COMPANION_EVENTS = [
  { id: "prestart", label: "Prestart" },
  { id: "scoreBar", label: "Score Bar" },
  { id: "fieldReady", label: "Field Ready" },
  { id: "matchStart", label: "Match Start" },
  { id: "teleopStart", label: "Teleop Start" },
  { id: "endgameStart", label: "Endgame Start" },
  { id: "matchEnd", label: "Match End" },
  { id: "matchAborted", label: "Match Aborted" },
  { id: "postResult", label: "Post Results" },
  { id: "matchPreview", label: "Match Preview" },
  { id: "allianceSelection", label: "Alliance Selection" },
  { id: "bracket", label: "Bracket" },
  { id: "redWins", label: "Red Wins" },
  { id: "blueWins", label: "Blue Wins" },
  { id: "tieMatch", label: "Tie Match" },
] as const;
type CompanionEventId = (typeof COMPANION_EVENTS)[number]["id"];

/** The FIXED set of Companion custom variables this integration writes. Names are
 *  OUR model (not operator-configurable) - point your Companion at these names.
 *  Shown verbatim on the /bitfocus page as an API-doc reference. */
export const COMPANION_VARIABLES = [
  { name: "match_name", description: "Full match label (our match namer)", example: "Qualification 42" },
  { name: "match_number", description: "Match number", example: "42" },
  { name: "match_level", description: "Qualification | Practice | Playoff | Final | Test", example: "Qualification" },
  { name: "match_state", description: "Raw FMS field state", example: "MatchTeleop" },
  { name: "screen", description: "Current audience-display screen", example: "score-reveal" },
  { name: "time_remaining", description: "Match clock, seconds", example: "45" },
  { name: "under_review", description: "Referee under-review flag", example: "false" },
  { name: "red_1", description: "Red station 1 team number", example: "254" },
  { name: "red_2", description: "Red station 2 team number", example: "1114" },
  { name: "red_3", description: "Red station 3 team number", example: "118" },
  { name: "blue_1", description: "Blue station 1 team number", example: "148" },
  { name: "blue_2", description: "Blue station 2 team number", example: "33" },
  { name: "blue_3", description: "Blue station 3 team number", example: "217" },
  { name: "red_alliance", description: "Red alliance name (playoffs)", example: "Alliance 1" },
  { name: "blue_alliance", description: "Blue alliance name (playoffs)", example: "Alliance 8" },
  { name: "red_score", description: "Red total score", example: "142" },
  { name: "blue_score", description: "Blue total score", example: "128" },
  { name: "winner", description: "red | blue | tie | (empty until results post)", example: "red" },
  { name: "red_rp", description: "Red ranking points", example: "4" },
  { name: "blue_rp", description: "Blue ranking points", example: "2" },
  { name: "red_fouls", description: "Foul points conceded to red", example: "10" },
  { name: "blue_fouls", description: "Foul points conceded to blue", example: "0" },
  { name: "red_fuel", description: "Red total fuel count", example: "88" },
  { name: "blue_fuel", description: "Blue total fuel count", example: "72" },
  { name: "red_climb", description: "Red total climb points", example: "30" },
  { name: "blue_climb", description: "Blue total climb points", example: "20" },
  { name: "red_high_score", description: "Red set a new event high score", example: "false" },
  { name: "blue_high_score", description: "Blue set a new event high score", example: "true" },
] as const;

export interface CompanionSnapshot {
  screen: Screen;
  /** Raw FMS field state (field monitor hub), e.g. "MatchTeleop". */
  fmsMatchState: string;
  match: MatchState | null;
  results: MatchState | null;
}
// #endregion

// #region config persistence
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

function defaultConfig(): CompanionConfig {
  return {
    enabled: true,
    variablesEnabled: true,
    liveScores: true,
    sinks: [
      {
        id: "local",
        label: "Local",
        address: "http://127.0.0.1:8000",
        enabled: true,
        buttons: {},
      },
    ],
  };
}

let config: CompanionConfig = defaultConfig();

export function initCompanion(): void {
  const raw = readSettings().companion as Partial<CompanionConfig> | undefined;
  if (raw && Array.isArray(raw.sinks)) {
    config = {
      enabled: !!raw.enabled,
      variablesEnabled: raw.variablesEnabled !== false,
      liveScores: raw.liveScores !== false,
      sinks: raw.sinks.map(normalizeSink),
    };
  }
  resetEdgeState();
}

function normalizeSink(s: Partial<CompanionSink>, i: number): CompanionSink {
  const buttons: Record<string, CompanionButton> = {};
  if (s.buttons && typeof s.buttons === "object") {
    for (const [k, v] of Object.entries(s.buttons)) {
      if (v && typeof v === "object") {
        buttons[k] = {
          page: Number((v as CompanionButton).page) || 0,
          row: Number((v as CompanionButton).row) || 0,
          column: Number((v as CompanionButton).column) || 0,
        };
      }
    }
  }
  return {
    id: s.id || `sink-${i}`,
    label: s.label || `Sink ${i + 1}`,
    address: (s.address || "").trim(),
    enabled: s.enabled !== false,
    buttons,
  };
}

export function getCompanionConfig(): CompanionConfig {
  return config;
}

export function setCompanionConfig(next: unknown): CompanionConfig {
  const n = (next ?? {}) as Partial<CompanionConfig>;
  config = {
    enabled: !!n.enabled,
    variablesEnabled: n.variablesEnabled !== false,
    liveScores: n.liveScores !== false,
    sinks: Array.isArray(n.sinks) ? n.sinks.map(normalizeSink) : [],
  };
  mergeSettings({ companion: config });
  resetEdgeState(); // re-sync presses + variables against the new config
  return config;
}
// #endregion

// #region companion HTTP (fire-and-forget)
function trimBase(address: string): string {
  return address.replace(/\/+$/, "");
}

async function press(address: string, b: CompanionButton): Promise<void> {
  const url = `${trimBase(address)}/api/location/${b.page}/${b.row}/${b.column}/press`;
  try {
    await fetch(url, { method: "POST" });
  } catch (e) {
    console.log(`Companion press failed (${url}):`, String(e));
  }
}

async function setVariable(address: string, name: string, value: string): Promise<void> {
  const url = `${trimBase(address)}/api/custom-variable/${encodeURIComponent(name)}/value`;
  try {
    await fetch(url, { method: "POST", body: value });
  } catch (e) {
    console.log(`Companion variable set failed (${url}):`, String(e));
  }
}

/** One-off press for the config UI's "Test" button. Returns a status the page
 *  can surface (Companion returns 200 on a mapped location, 204/404 otherwise). */
export async function testPress(
  address: string,
  b: CompanionButton
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const url = `${trimBase(address)}/api/location/${b.page}/${b.row}/${b.column}/press`;
  try {
    const r = await fetch(url, { method: "POST" });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
// #endregion

// #region state -> event/variable mapping
// Match-flow events come from the FMS field state (same source the official uses).
function fmsStateToEvent(s: string): CompanionEventId | null {
  switch (s) {
    case "Prestarting":
    case "PrestartingTO":
      return "prestart";
    case "WaitingForMatchReady":
      return "scoreBar";
    case "WaitingForMatchStart":
      return "fieldReady";
    case "MatchAuto":
    case "GameSpecificData":
      return "matchStart";
    case "MatchTransition":
    case "MatchTeleop":
      return "teleopStart";
    case "WaitingForCommit":
      return "matchEnd";
    case "MatchCancelled":
    case "MatchAborted":
      return "matchAborted";
    default:
      return null;
  }
}

// Screen/video-switch events come from what the display is actually showing.
function screenToEvent(screen: Screen): CompanionEventId | null {
  if (screen === "match-preview") return "matchPreview";
  if (screen === "match-endgame") return "endgameStart"; // official never fires this
  if (screen === "score-reveal") return "postResult";
  if (
    screen === "alliance-selection" ||
    screen === "alliance-selection-fullscreen" ||
    screen === "break-timer"
  )
    return "allianceSelection";
  if (screen === "playoff-bracket") return "bracket";
  return null;
}

const RESULT_SCREENS = new Set<Screen>(["score-reveal", "scores-ready", "match-end"]);

function levelLabel(t: MatchType): string {
  switch (t) {
    case "q":
      return "Qualification";
    case "p":
      return "Practice";
    case "t":
      return "Test";
    case "sf":
      return "Playoff";
    case "f":
      return "Final";
    default:
      return "";
  }
}

function matchNameOf(m: MatchState): string {
  const n = m.details.matchNumber;
  switch (m.details.matchType) {
    case "q":
      return `Qualification ${n}`;
    case "p":
      return `Practice ${n}`;
    case "t":
      return "Test Match";
    case "sf":
      return `Playoff ${n}`;
    case "f":
      return `Final ${n}`;
    default:
      return String(n);
  }
}
// #endregion

// #region sync
let lastMatchStateEvent: CompanionEventId | null = null;
let lastScreenEvent: CompanionEventId | null = null;
let lastWinnerKey: string | null = null;
let lastVars: Record<string, string> = {};
// Variable feed is throttled to <=1/sec (leading + trailing) so live scoring
// (which can change many times a second) never floods Companion; the trailing
// flush guarantees the final values still land.
let latestVarSnap: CompanionSnapshot | null = null;
let lastVarFlush = 0;
let varTimer: ReturnType<typeof setTimeout> | null = null;

function resetEdgeState(): void {
  lastMatchStateEvent = null;
  lastScreenEvent = null;
  lastWinnerKey = null;
  lastVars = {};
  latestVarSnap = null;
  lastVarFlush = 0;
  if (varTimer) {
    clearTimeout(varTimer);
    varTimer = null;
  }
}

function fireEvent(sinks: CompanionSink[], eventId: CompanionEventId): void {
  for (const sink of sinks) {
    const b = sink.buttons[eventId];
    if (b) void press(sink.address, b);
  }
}

export function syncCompanion(snap: CompanionSnapshot): void {
  if (!config.enabled) return;
  const sinks = config.sinks.filter((s) => s.enabled && s.address);
  if (sinks.length === 0) return;

  // 1) Button presses, edge-triggered so the 2s heartbeat never re-fires them.
  const mEvent = fmsStateToEvent(snap.fmsMatchState);
  if (mEvent && mEvent !== lastMatchStateEvent) fireEvent(sinks, mEvent);
  lastMatchStateEvent = mEvent;

  const sEvent = screenToEvent(snap.screen);
  if (sEvent && sEvent !== lastScreenEvent) {
    fireEvent(sinks, sEvent);
    // Winner press on entering the reveal, keyed so a repost can't double-fire.
    if (sEvent === "postResult" && snap.results?.score.winner) {
      const key = `${snap.results.details.matchType}-${snap.results.details.matchNumber}`;
      if (key !== lastWinnerKey) {
        const w = snap.results.score.winner;
        fireEvent(sinks, w === "Red" ? "redWins" : w === "Blue" ? "blueWins" : "tieMatch");
        lastWinnerKey = key;
      }
    }
  }
  lastScreenEvent = sEvent;

  // 2) Variable feed, throttled to <=1/sec and only pushing changed values.
  if (config.variablesEnabled) queueVariables(snap);
}

function queueVariables(snap: CompanionSnapshot): void {
  latestVarSnap = snap;
  const wait = 1000 - (Date.now() - lastVarFlush);
  if (wait <= 0) {
    flushVariables();
  } else if (!varTimer) {
    varTimer = setTimeout(() => {
      varTimer = null;
      flushVariables();
    }, wait);
  }
}

function flushVariables(): void {
  lastVarFlush = Date.now();
  const snap = latestVarSnap;
  if (!snap || !config.enabled || !config.variablesEnabled) return;
  const sinks = config.sinks.filter((s) => s.enabled && s.address);
  if (sinks.length === 0) return;

  const onResult = RESULT_SCREENS.has(snap.screen);
  const m = onResult ? snap.results ?? snap.match : snap.match;

  // Names here MUST match COMPANION_VARIABLES (the documented model).
  // Score vars update live only if liveScores is on; otherwise they refresh only
  // once results are showing (score reveal). Match context always updates.
  const pushScores = config.liveScores || onResult;
  const vars: Record<string, string> = {};
  vars["match_state"] = snap.fmsMatchState || "";
  vars["screen"] = snap.screen || "";
  if (m) {
    vars["match_name"] = matchNameOf(m);
    vars["match_number"] = String(m.details.matchNumber);
    vars["match_level"] = levelLabel(m.details.matchType);
    vars["time_remaining"] = String(m.timer ?? 0);
    vars["under_review"] = m.underReview || m.underReviewLatched ? "true" : "false";
    vars["red_alliance"] = m.details.redAlliance ?? "";
    vars["blue_alliance"] = m.details.blueAlliance ?? "";
    for (let i = 0; i < 3; i++) {
      vars[`red_${i + 1}`] = m.teams.red[i]?.number ? String(m.teams.red[i].number) : "";
      vars[`blue_${i + 1}`] = m.teams.blue[i]?.number ? String(m.teams.blue[i].number) : "";
    }
    if (pushScores) {
      vars["red_score"] = String(m.score.red.score);
      vars["blue_score"] = String(m.score.blue.score);
      vars["red_rp"] = String(m.score.red.rankingPoints ?? 0);
      vars["blue_rp"] = String(m.score.blue.rankingPoints ?? 0);
      vars["red_fouls"] = String(m.score.red.foulPoints ?? 0);
      vars["blue_fouls"] = String(m.score.blue.foulPoints ?? 0);
      vars["red_fuel"] = String(m.score.red.totalFuelCount ?? 0);
      vars["blue_fuel"] = String(m.score.blue.totalFuelCount ?? 0);
      vars["red_climb"] = String(m.score.red.totalClimbPoints ?? 0);
      vars["blue_climb"] = String(m.score.blue.totalClimbPoints ?? 0);
      vars["red_high_score"] = m.score.red.isHighScore ? "true" : "false";
      vars["blue_high_score"] = m.score.blue.isHighScore ? "true" : "false";
    }
  }
  // Winner only meaningful once results are showing.
  if (pushScores) {
    const w = onResult ? snap.results?.score.winner : undefined;
    vars["winner"] = w === "Red" ? "red" : w === "Blue" ? "blue" : w === "Tie" ? "tie" : "";
  }

  for (const [name, value] of Object.entries(vars)) {
    if (lastVars[name] === value) continue;
    lastVars[name] = value;
    for (const sink of sinks) void setVariable(sink.address, name, value);
  }
}
// #endregion
