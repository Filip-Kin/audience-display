import { Database } from "bun:sqlite";
import { readdirSync } from "fs";
import { join } from "path";

/**
 * Merge synced FMS-log chunks back into one SQLite database for analysis.
 *
 *   bun tools/import-fms-log-chunks.ts <chunk-dir> [out.sqlite]
 *
 * Chunks are the `fms-log-<host>-<first>-<last>.ndjson.gz` files the display
 * uploads to Nextcloud (Robots/fms-logs). Re-importing overlapping chunks is
 * safe: rows keep their original ids per host and are upserted.
 */

const [dir, out = "fms-log-merged.sqlite"] = process.argv.slice(2);
if (!dir) {
  console.log("usage: bun tools/import-fms-log-chunks.ts <chunk-dir> [out.sqlite]");
  process.exit(1);
}

const db = new Database(out);
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    host TEXT NOT NULL,
    id INTEGER NOT NULL,
    startedAt TEXT NOT NULL,
    fmsUrl TEXT NOT NULL,
    appVersion TEXT,
    PRIMARY KEY (host, id)
  );
  CREATE TABLE IF NOT EXISTS log (
    host TEXT NOT NULL,
    id INTEGER NOT NULL,
    runId INTEGER NOT NULL,
    ts TEXT NOT NULL,
    kind TEXT NOT NULL,
    direction TEXT NOT NULL,
    name TEXT NOT NULL,
    status INTEGER,
    data TEXT,
    PRIMARY KEY (host, id)
  );
`);
const upsertRun = db.prepare(
  "INSERT OR REPLACE INTO runs (host, id, startedAt, fmsUrl, appVersion) VALUES (?, ?, ?, ?, ?)"
);
const upsertLog = db.prepare(
  "INSERT OR REPLACE INTO log (host, id, runId, ts, kind, direction, name, status, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

const files = readdirSync(dir).filter((f) => f.endsWith(".ndjson.gz")).sort();
let total = 0;
for (const f of files) {
  const raw = Bun.gunzipSync(new Uint8Array(await Bun.file(join(dir, f)).arrayBuffer()));
  const lines = new TextDecoder().decode(raw).split("\n").filter(Boolean);
  let host = "unknown";
  const tx = db.transaction(() => {
    for (const line of lines) {
      const row = JSON.parse(line);
      if (row.type === "meta") {
        host = row.host;
        for (const run of row.runs ?? []) upsertRun.run(host, run.id, run.startedAt, run.fmsUrl, run.appVersion);
        continue;
      }
      upsertLog.run(host, row.id, row.runId, row.ts, row.kind, row.direction, row.name, row.status, row.data);
      total++;
    }
  });
  tx();
  console.log(`${f}: ${lines.length - 1} rows`);
}
console.log(`Imported ${total} rows from ${files.length} chunks into ${out}`);
