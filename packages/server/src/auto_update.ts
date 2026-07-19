import { basename, dirname, join } from "path";
import { spawn } from "child_process";
import { createWriteStream, readdirSync, unlinkSync } from "fs";
import { finished } from "node:stream/promises";
import { Readable } from "node:stream";
import pkg from "../../../package.json";

/**
 * Startup auto-update for the compiled Windows exe, using the live-captions
 * model: release assets are VERSIONED (audience-display-<version>.exe), so an
 * update is just "download the new exe next to this one, launch it detached,
 * exit". No renaming or overwriting of a running binary; when a build finds
 * itself up to date it deletes the older versioned exes sitting next to it.
 *
 * Fails open in every direction (offline event wifi, GitHub down, no asset):
 * any problem just logs and the display starts normally. Set AUTO_UPDATE=0 to
 * disable entirely.
 */

const REPO = "Filip-Kin/audience-display";

const isCompiledExe =
  process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");

/** Numeric per-part compare; "v26.1" and "26.1.0" compare equal. */
function newerThan(remote: string, local: string): boolean {
  const parse = (v: string): number[] => v.replace(/^v/, "").split(".").map((p) => Number(p) || 0);
  const a = parse(remote);
  const b = parse(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

export async function checkForUpdate(): Promise<void> {
  if (!isCompiledExe || process.env.AUTO_UPDATE === "0") return;
  const dir = dirname(process.execPath);
  try {
    // The releases/latest page redirects to .../tag/v<version>; reading the
    // final URL gets the version without touching the rate-limited API.
    const res = await fetch(`https://github.com/${REPO}/releases/latest`, {
      signal: AbortSignal.timeout(5000),
    });
    const latest = res.url.split("/").pop()?.replace(/^v/, "") || "0.0.0";

    if (newerThan(latest, pkg.version)) {
      console.log(`Update available: ${pkg.version} -> ${latest}, downloading...`);
      const name = `audience-display-${latest}.exe`;
      const target = join(dir, name);
      const dl = await fetch(`https://github.com/${REPO}/releases/download/v${latest}/${name}`, {
        signal: AbortSignal.timeout(180_000),
      });
      if (!dl.ok || dl.body === null) {
        console.log(`Update download failed (HTTP ${dl.status}); starting current version`);
        return;
      }
      const stream = createWriteStream(target);
      await finished(Readable.fromWeb(dl.body as never).pipe(stream));
      console.log(`Launching ${name}`);
      spawn(`"${target}"`, [], { detached: true, shell: true, cwd: dir, stdio: "ignore" }).unref();
      process.exit(0);
    }

    console.log(`Running latest version: ${pkg.version}`);
    // Newest build cleans up the older exes (and any legacy update leftovers)
    // sitting next to it.
    const self = basename(process.execPath);
    for (const f of readdirSync(dir)) {
      if (f.startsWith("audience-display") && f.endsWith(".exe") && f !== self) {
        console.log(`Removing old version: ${f}`);
        try {
          unlinkSync(join(dir, f));
        } catch {
          // Still locked; a later boot gets it.
        }
      }
    }
  } catch (err) {
    console.log("Update check failed (continuing with current version):", err);
  }
}
