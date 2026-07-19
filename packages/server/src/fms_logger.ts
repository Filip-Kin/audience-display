import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
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

/** OS-appropriate appdata dir for the program (next to nothing volatile). */
export function appDataDir(): string {
  if (process.platform === "win32" && process.env.APPDATA) {
    return join(process.env.APPDATA, "audience-display");
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

export function initFmsLogger(fmsUrl: string): void {
  try {
    const dir = appDataDir();
    mkdirSync(dir, { recursive: true });
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
    `);
    db.prepare("INSERT INTO runs (startedAt, fmsUrl, appVersion) VALUES (?, ?, ?)").run(ts(), fmsUrl, pkg.version);
    runId = (db.query("SELECT last_insert_rowid() AS id").get() as { id: number }).id;
    insertLog = db.prepare(
      "INSERT INTO log (runId, ts, kind, direction, name, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    installWebSocketLogging();
    console.log(`FMS logging to ${join(dir, "fms-log.sqlite")} (run ${runId})`);
  } catch (err) {
    console.log("FMS logger disabled (failed to initialise):", err);
    db = null;
    insertLog = null;
  }
}

function write(kind: string, direction: string, name: string, status: number | null, data: string): void {
  if (!insertLog || runId === null) return;
  try {
    insertLog.run(runId, ts(), kind, direction, name, status, data);
  } catch {
    // Never let logging failures affect the display.
  }
}

export function logRest(path: string, status: number, body: string): void {
  write("rest", "response", path, status, body);
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
