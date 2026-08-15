import { Database } from "bun:sqlite";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import pkg from "../../../package.json";

/**
 * Logs ALL FMS communication to a SQLite database for later reverse
 * engineering: every SignalR websocket frame (both directions, raw, including
 * hub methods nothing subscribes to) and every REST request the display makes.
 *
 * Logging must never take the display down: any failure turns the logger into
 * a no-op and the show goes on.
 */

const isCompiledExe =
  process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");

/** OS-appropriate appdata dir for the program (next to nothing volatile).
 *
 * On Windows this MUST resolve to the SAME folder on every launch, or persisted
 * settings (Bitfocus config, vMix URL, captions, team names) appear to reset.
 * The auto-updater relaunches the exe detached via cmd.exe, and that child does
 * not always inherit %APPDATA%; if it were missing we used to fall through to
 * `<exeDir>/appdata` - a DIFFERENT folder - so the post-update process read an
 * empty settings.json. Reconstruct the canonical Roaming path from the home dir
 * (USERPROFILE, effectively always present) when APPDATA is absent so the path
 * never drifts. This is the exact same location as %APPDATA%\audience-display,
 * so existing settings are picked up unchanged. */
export function appDataDir(): string {
  if (process.platform === "win32") {
    const roaming = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(roaming, "audience-display");
  }
  if (isCompiledExe) return join(dirname(process.execPath), "appdata");
  const base = process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  return join(base, "audience-display");
}

let db: Database | null = null;
let runId: number | null = null;
let insertLog: ReturnType<Database["prepare"]> | null = null;

function ts(): string {
  return new Date().toISOString();
}

// User-facing on/off switch (settings gear on the display). On by default;
// persisted in appdata so the choice survives restarts. Only gates writing new
// rows - the database stays open so sync/import of existing rows still works.
let loggingEnabled = true;

const settingsPath = () => join(appDataDir(), "settings.json");

export function isFmsLoggingEnabled(): boolean {
  return loggingEnabled;
}

export function setFmsLoggingEnabled(on: boolean): void {
  loggingEnabled = on;
  try {
    // Merge, not overwrite: settings.json is shared with caption_control etc.
    let existing: Record<string, unknown> = {};
    try {
      existing = JSON.parse(readFileSync(settingsPath(), "utf-8"));
    } catch {
      // No file yet.
    }
    writeFileSync(settingsPath(), JSON.stringify({ ...existing, fmsLogging: on }, null, 2));
  } catch {
    // Not persisted; still applies for this run.
  }
}

export function initFmsLogger(fmsUrl: string): void {
  try {
    const dir = appDataDir();
    mkdirSync(dir, { recursive: true });
    try {
      const saved = JSON.parse(readFileSync(settingsPath(), "utf-8"));
      if (typeof saved.fmsLogging === "boolean") loggingEnabled = saved.fmsLogging;
    } catch {
      // No settings file yet; stay on the default (enabled).
    }
    db = new Database(join(dir, "fms-log.sqlite"));
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startedAt TEXT NOT NULL,
        fmsUrl TEXT NOT NULL,
        appVersion TEXT
      );
      CREATE TABLE IF NOT EXISTS log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        runId INTEGER NOT NULL,
        ts TEXT NOT NULL,
        kind TEXT NOT NULL,       -- 'ws' | 'rest'
        direction TEXT NOT NULL,  -- ws: 'recv'/'send'; rest: 'response'
        name TEXT NOT NULL,       -- ws: socket URL; rest: request path
        status INTEGER,           -- rest only: HTTP status
        data TEXT                 -- raw frame / response body
      );
      CREATE INDEX IF NOT EXISTS idx_log_run ON log(runId);
      CREATE TABLE IF NOT EXISTS sync_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    db.prepare("INSERT INTO runs (startedAt, fmsUrl, appVersion) VALUES (?, ?, ?)").run(ts(), fmsUrl, pkg.version);
    runId = (db.query("SELECT last_insert_rowid() AS id").get() as { id: number }).id;
    insertLog = db.prepare(
      "INSERT INTO log (runId, ts, kind, direction, name, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    insertBatch = db.transaction((rows: LogTuple[]) => {
      for (const row of rows) insertLog!.run(...row);
    }) as unknown as (rows: LogTuple[]) => void;
    startFlushTimer();
    installWebSocketLogging();
    console.log(`FMS logging to ${join(dir, "fms-log.sqlite")} (run ${runId})`);
  } catch (err) {
    console.log("FMS logger disabled (failed to initialise):", err);
    db = null;
    insertLog = null;
  }
}

// #region batched, throttled logging
// A synchronous INSERT per frame used to run on the display's event loop. During
// a match the gameSpecificHub score firehose is ~140 frames/s (and ~97% are
// no-ops where only a TimeStamp changes), so those writes starved rendering and
// the realtime score visibly lagged. Two fixes: buffer rows and flush them in a
// single transaction on a timer (the hot path becomes an array push), and cap
// the redundant score frames to one per alliance per second.
type LogTuple = [number, string, string, string, string, number | null, string];

let buffer: LogTuple[] = [];
let insertBatch: ((rows: LogTuple[]) => void) | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
const FLUSH_MS = 1000;
const MAX_BUFFER = 2000; // safety valve if the flush timer is starved under load

const SEP = "\x1e"; // SignalR JSON record separator (terminates each message)
const SCORE_THROTTLE_MS = 1000;
const lastScoreLog = new Map<string, number>();

function flushLog(): void {
  if (!insertBatch || buffer.length === 0) return;
  const rows = buffer;
  buffer = [];
  try {
    insertBatch(rows);
  } catch {
    // Never let logging failures affect the display.
  }
}

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flushLog, FLUSH_MS);
  // Flush whatever is buffered on a clean shutdown; a hard kill loses <1s of rows.
  process.on("beforeExit", flushLog);
}

// A lone, record-separator-terminated score frame we may throttle; null means log
// it (multi-message frames are rare and could carry other events, so keep them).
function throttledScoreTarget(data: string): string | null {
  if (data.indexOf(SEP) !== data.length - 1) return null; // not a single message
  if (data.includes('"RedScoreChanged"')) return "RedScoreChanged";
  if (data.includes('"BlueScoreChanged"')) return "BlueScoreChanged";
  return null;
}

function write(kind: string, direction: string, name: string, status: number | null, data: string): void {
  if (!loggingEnabled) return;
  if (runId === null || !insertBatch) return;

  if (kind === "ws" && direction === "recv") {
    const scoreTarget = throttledScoreTarget(data);
    if (scoreTarget) {
      const now = Date.now();
      if (now - (lastScoreLog.get(scoreTarget) ?? 0) < SCORE_THROTTLE_MS) return;
      lastScoreLog.set(scoreTarget, now);
    }
  }

  buffer.push([runId, ts(), kind, direction, name, status, data]);
  if (buffer.length >= MAX_BUFFER) flushLog();
}
// #endregion

export function logRest(path: string, status: number, body: string): void {
  write("rest", "response", path, status, body);
}

/** True when the log database is open and rows are being recorded. */
export function fmsLogActive(): boolean {
  return db !== null;
}

export interface LogRow {
  id: number;
  runId: number;
  ts: string;
  kind: string;
  direction: string;
  name: string;
  status: number | null;
  data: string;
}

export interface RunRow {
  id: number;
  startedAt: string;
  fmsUrl: string;
  appVersion: string | null;
}

/** Rows newer than `afterId`, oldest first, capped for chunked incremental sync. */
export function readLogRowsAfter(afterId: number, limit: number): LogRow[] {
  if (!db) return [];
  try {
    return db
      .query("SELECT id, runId, ts, kind, direction, name, status, data FROM log WHERE id > ?1 ORDER BY id LIMIT ?2")
      .all(afterId, limit) as LogRow[];
  } catch {
    return [];
  }
}

/** The runs referenced by a chunk, so every chunk is self-describing. */
export function readRuns(runIds: number[]): RunRow[] {
  if (!db || runIds.length === 0) return [];
  try {
    const placeholders = runIds.map(() => "?").join(",");
    return db.query(`SELECT id, startedAt, fmsUrl, appVersion FROM runs WHERE id IN (${placeholders})`).all(...runIds) as RunRow[];
  } catch {
    return [];
  }
}

export function getSyncCursor(): number {
  if (!db) return 0;
  try {
    const row = db.query("SELECT value FROM sync_state WHERE key = 'lastSyncedLogId'").get() as { value: string } | null;
    return row ? Number(row.value) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Only advanced AFTER a chunk uploads successfully, so nothing is ever skipped. */
export function setSyncCursor(id: number): void {
  if (!db) return;
  try {
    db.prepare("INSERT INTO sync_state (key, value) VALUES ('lastSyncedLogId', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1").run(String(id));
  } catch {
    // Worst case the next sync re-uploads a chunk; uploads are idempotent by name.
  }
}

/**
 * A WebSocket class that logs every frame in both directions, raw. Handed to
 * SignalR via HttpConnectionOptions.WebSocket (in this runtime SignalR would
 * otherwise pick up the `ws` npm package, so patching the global alone is not
 * enough). The Bun.serve display websocket is unaffected.
 */
function makeLoggingWebSocket(): typeof WebSocket {
  const Native = globalThis.WebSocket;
  class LoggingWebSocket extends Native {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      const name = String(url);
      this.addEventListener("message", (ev) => {
        const data = typeof ev.data === "string" ? ev.data : "<binary>";
        write("ws", "recv", name, null, data);
      });
    }
    send(data: Parameters<WebSocket["send"]>[0]): void {
      write("ws", "send", String(this.url), null, typeof data === "string" ? data : "<binary>");
      super.send(data);
    }
  }
  return LoggingWebSocket as unknown as typeof WebSocket;
}

/** WebSocket constructor for SignalR's HttpConnectionOptions.WebSocket. */
export const FmsLoggingWebSocket = makeLoggingWebSocket();

function installWebSocketLogging(): void {
  globalThis.WebSocket = FmsLoggingWebSocket;
}
