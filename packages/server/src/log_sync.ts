import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { hostname } from "os";
import { appDataDir, fmsLogActive, getSyncCursor, readLogRowsAfter, readRuns, setSyncCursor } from "./fms_logger";

/**
 * Incremental FMS-log sync to the NAS (Nextcloud WebDAV): every sync exports
 * only rows newer than the last successfully-uploaded id as a gzipped NDJSON
 * chunk, so a multi-gigabyte local database stays cheap to keep up to date.
 * Runs on a timer, plus immediately after every finals match commit. Chunks
 * are append-only and idempotent by name; the cursor only advances after a
 * 2xx, so a failed upload just retries the same rows next time. Merge chunks
 * back into one database with tools/import-fms-log-chunks.ts.
 *
 * Credentials are NEVER in the repo: `log-sync.json` next to the exe (or in
 * the appdata dir), or env vars. Without credentials, or on an isolated field
 * network, sync silently stays off / fails quietly.
 *
 * log-sync.json: { "user": "filip", "pass": "<nc app password>",
 *                  "url"?: "<webdav dir>", "intervalMin"?: 10 }
 */

const DEFAULT_URL = "https://nc.filipkin.com/remote.php/dav/files/{user}/Robots/fms-logs/";
const DEFAULT_INTERVAL_MIN = 10;
/** Rows per chunk; ~1-2 KiB/row raw, gzips ~10-20x, so chunks stay a few MiB. */
const CHUNK_ROWS = 20_000;

interface SyncConfig {
  user: string;
  pass: string;
  url: string;
  intervalMin: number;
}

const isCompiledExe =
  process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");

function loadConfig(): SyncConfig | null {
  let user = process.env.LOG_SYNC_USER;
  let pass = process.env.LOG_SYNC_PASS;
  let url = process.env.LOG_SYNC_URL;
  let intervalMin = Number(process.env.LOG_SYNC_INTERVAL_MIN) || 0;

  if (!user || !pass) {
    const candidates = [
      isCompiledExe ? join(dirname(process.execPath), "log-sync.json") : join(process.cwd(), "log-sync.json"),
      join(appDataDir(), "log-sync.json"),
    ];
    for (const p of candidates) {
      if (!existsSync(p)) continue;
      try {
        const cfg = JSON.parse(readFileSync(p, "utf-8")) as Partial<SyncConfig>;
        user = user || cfg.user;
        pass = pass || cfg.pass;
        url = url || cfg.url;
        intervalMin = intervalMin || Number(cfg.intervalMin) || 0;
        break;
      } catch (err) {
        console.log(`Ignoring malformed ${p}:`, err);
      }
    }
  }

  if (!user || !pass) return null;
  return {
    user,
    pass,
    url: (url || DEFAULT_URL).replace("{user}", user),
    intervalMin: intervalMin || DEFAULT_INTERVAL_MIN,
  };
}

let config: SyncConfig | null = null;
let syncing = false;
let lastError = "";

export function initLogSync(): void {
  config = loadConfig();
  if (!config) {
    console.log("Log sync disabled (no credentials in log-sync.json or LOG_SYNC_USER/LOG_SYNC_PASS)");
    return;
  }
  console.log(`Log sync enabled: ${config.url} every ${config.intervalMin}min`);
  setInterval(() => void syncFmsLog("periodic"), config.intervalMin * 60_000);
  // First upload shortly after boot so a fresh run appears on the NAS early.
  setTimeout(() => void syncFmsLog("startup"), 60_000);
}

function quietError(reason: string, msg: string): void {
  // Log each distinct failure once, not every interval on an offline field network.
  if (msg !== lastError) {
    lastError = msg;
    console.log(`Log sync (${reason}) failed (continuing): ${msg}`);
  }
}

/**
 * Push all unsynced rows now, one chunk at a time. Serialized; overlapping
 * calls collapse into the running one.
 */
export async function syncFmsLog(reason: string): Promise<void> {
  if (!config || syncing || !fmsLogActive()) return;
  syncing = true;
  try {
    const auth = `Basic ${Buffer.from(`${config.user}:${config.pass}`).toString("base64")}`;
    const base = config.url.replace(/\/+$/, "");
    const host = hostname();
    let uploaded = 0;

    for (;;) {
      const cursor = getSyncCursor();
      const rows = readLogRowsAfter(cursor, CHUNK_ROWS);
      if (rows.length === 0) break;

      const first = rows[0].id;
      const last = rows[rows.length - 1].id;
      const runIds = [...new Set(rows.map((r) => r.runId))];
      const meta = { type: "meta", host, firstId: first, lastId: last, runs: readRuns(runIds) };
      const ndjson = [JSON.stringify(meta), ...rows.map((r) => JSON.stringify(r))].join("\n");
      const gz = Bun.gzipSync(Buffer.from(ndjson));

      // Zero-padded ids keep the chunk files sorted lexically in the folder.
      const name = `fms-log-${host}-${String(first).padStart(10, "0")}-${String(last).padStart(10, "0")}.ndjson.gz`;
      const res = await fetch(`${base}/${name}`, {
        method: "PUT",
        headers: { Authorization: auth, "Content-Type": "application/gzip" },
        body: gz,
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        quietError(reason, `HTTP ${res.status} uploading ${name}`);
        return;
      }
      setSyncCursor(last);
      uploaded += rows.length;
      if (rows.length < CHUNK_ROWS) break;
    }

    if (uploaded > 0) {
      console.log(`Log sync (${reason}): uploaded ${uploaded} rows`);
      lastError = "";
    }
  } catch (err) {
    quietError(reason, String(err));
  } finally {
    syncing = false;
  }
}
