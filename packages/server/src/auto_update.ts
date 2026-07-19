import { dirname, join } from "path";
import pkg from "../../../package.json";

/**
 * Startup auto-update for the compiled Windows exe: compare the embedded
 * package.json version against the latest GitHub release; when the release is
 * newer, download its exe next to the running one, hand off to a tiny batch
 * script that swaps the files once this process exits, and restart.
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
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { "User-Agent": "audience-display-updater" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.log(`Update check: GitHub returned ${res.status}; skipping`);
      return;
    }
    const release = (await res.json()) as {
      tag_name: string;
      assets: Array<{ name: string; browser_download_url: string }>;
    };
    if (!newerThan(release.tag_name, pkg.version)) {
      console.log(`Up to date (local ${pkg.version}, latest ${release.tag_name})`);
      return;
    }
    const asset = release.assets.find((a) => a.name.endsWith(".exe"));
    if (!asset) {
      console.log(`Update ${release.tag_name} has no exe asset; skipping`);
      return;
    }

    console.log(`Updating ${pkg.version} -> ${release.tag_name}, downloading ${asset.name}...`);
    const dl = await fetch(asset.browser_download_url, {
      headers: { "User-Agent": "audience-display-updater" },
      signal: AbortSignal.timeout(180_000),
    });
    if (!dl.ok) {
      console.log(`Update download failed (HTTP ${dl.status}); starting current version`);
      return;
    }
    const bytes = new Uint8Array(await dl.arrayBuffer());
    // A real compiled exe is >50 MB; anything tiny is an error page, not a build.
    if (bytes.length < 10_000_000) {
      console.log(`Update download suspiciously small (${bytes.length} bytes); starting current version`);
      return;
    }

    const exePath = process.execPath;
    const dir = dirname(exePath);
    const updatePath = join(dir, "audience-display.update.exe");
    const batPath = join(dir, "apply-update.bat");
    await Bun.write(updatePath, bytes);
    // The bat waits for this process to release the exe, swaps, and relaunches.
    await Bun.write(
      batPath,
      [
        "@echo off",
        "timeout /t 2 /nobreak >nul",
        `:retry`,
        `move /y "${updatePath}" "${exePath}" >nul 2>&1 || (timeout /t 1 /nobreak >nul & goto retry)`,
        `start "" "${exePath}"`,
        `del "%~f0"`,
        "",
      ].join("\r\n")
    );
    console.log(`Update downloaded; restarting as ${release.tag_name}`);
    Bun.spawn(["cmd", "/c", "start", "/min", "", batPath], { stdout: "ignore", stderr: "ignore" });
    process.exit(0);
  } catch (err) {
    console.log("Update check failed (continuing with current version):", err);
  }
}
