/**
 * Publish per-profile media (victory videos + loading cover) to the asset
 * bucket the display server syncs from. See packages/lib/asset_manifest.ts.
 *
 *   bun tools/publish-assets.ts [<profile>...] [--dry-run]
 *
 * With no profile ids it publishes every folder in
 * packages/ui/public/animations/ except `default` (which ships in the exe).
 * Files are uploaded content-addressed (files/<sha256>.<ext>, immutable) and
 * skipped when the bucket already has them; the profile's manifest is
 * rewritten last (no-cache), so a display never sees a manifest that points
 * at an object that is not there yet. Needs `gcloud` signed in with write
 * access to the bucket.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdtempSync } from "fs";
import { extname, join } from "path";
import { tmpdir } from "os";
import { ASSET_BUCKET, type AssetEntry, type AssetManifest } from "../packages/lib/asset_manifest";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "packages/ui/public/animations");
const GS = `gs://${ASSET_BUCKET}`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const requested = args.filter((a) => !a.startsWith("--"));
const profiles = requested.length
  ? requested
  : readdirSync(SRC, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "default")
      .map((d) => d.name);

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

function run(cmd: string[]): string {
  const p = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "pipe" });
  if (p.exitCode !== 0) {
    throw new Error(`${cmd.join(" ")} failed: ${p.stderr.toString().trim()}`);
  }
  return p.stdout.toString();
}

function existingObjects(): Set<string> {
  const p = Bun.spawnSync(["gcloud", "storage", "ls", `${GS}/files/`], {
    stdout: "pipe",
    stderr: "pipe",
  });
  // An empty prefix is an error from `ls`; treat it as no objects.
  if (p.exitCode !== 0) return new Set();
  return new Set(
    p.stdout
      .toString()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.slice(GS.length + 1))
  );
}

const have = existingObjects();
const tmp = mkdtempSync(join(tmpdir(), "ad-assets-"));

for (const profile of profiles) {
  if (profile === "default") throw new Error("default ships in the exe; not published");
  const dir = join(SRC, profile);
  const names = readdirSync(dir)
    .filter((n) => !n.startsWith(".") && statSync(join(dir, n)).isFile())
    .sort();
  if (!names.length) {
    console.log(`${profile}: no files, skipped`);
    continue;
  }
  const files: AssetEntry[] = [];
  for (const name of names) {
    const ext = extname(name).toLowerCase();
    const type = CONTENT_TYPES[ext];
    if (!type) throw new Error(`${profile}/${name}: unknown type ${ext}`);
    const data = readFileSync(join(dir, name));
    const sha256 = new Bun.CryptoHasher("sha256").update(data).digest("hex");
    const object = `files/${sha256}${ext}`;
    files.push({ path: `animations/${profile}/${name}`, size: data.byteLength, sha256, object });
    if (have.has(object)) {
      console.log(`${profile}/${name}: already in bucket`);
      continue;
    }
    console.log(`${profile}/${name}: upload ${(data.byteLength / 1e6).toFixed(1)} MB -> ${object}`);
    if (!dryRun) {
      run([
        "gcloud", "storage", "cp", join(dir, name), `${GS}/${object}`,
        `--content-type=${type}`,
        "--cache-control=public, max-age=31536000, immutable",
      ]);
      have.add(object);
    }
  }
  const manifest: AssetManifest = { profile, generated: new Date().toISOString(), files };
  const manifestPath = join(tmp, `${profile}.json`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`${profile}: manifest (${files.length} files)`);
  if (!dryRun) {
    run([
      "gcloud", "storage", "cp", manifestPath, `${GS}/manifests/${profile}.json`,
      "--content-type=application/json",
      "--cache-control=no-cache, max-age=0",
    ]);
  }
}
