import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import {
  ASSET_BASE_URL,
  isValidAssetEntry,
  type AssetEntry,
  type AssetManifest,
} from "lib";

/**
 * Per-profile media cache. The exe embeds only the default victory pack and
 * the stock cover; each other profile's videos and cover come from the asset
 * bucket (see lib/asset_manifest.ts) and are kept in `<dir>/assets/<profile>/`
 * next to the exe, so a venue that fetched them once runs offline.
 *
 * Nothing here blocks startup or a reveal: sync runs in the background, and
 * until a profile's whole set is on disk and verified, every one of its
 * animation URLs is answered with the matching default-pack file. Serving the
 * whole default set (never a mix of profile video and default cover, or the
 * reverse) keeps the cover matching the video's first frame.
 */

const MANIFEST_TIMEOUT_MS = 10_000;
const FILE_TIMEOUT_MS = 120_000;
const RETRY_MS = 5 * 60_000;
const MANIFEST_FILE = "manifest.json";

/** Default-pack file served when a profile's own file is not ready. */
function defaultFor(path: string): string | null {
  const name = path.split("/").pop() ?? "";
  if (name === "first-frame.png") return "animations/first-frame.png";
  if (/^(redwins|bluewins|tie|idle)\.mp4$/.test(name)) return `animations/default/${name}`;
  return null;
}

function sha256(data: Uint8Array): string {
  return new Bun.CryptoHasher("sha256").update(data).digest("hex");
}

type ProfileCache = {
  /** Every manifest entry is on disk with the right hash. */
  complete: boolean;
  files: Map<string, AssetEntry>;
};

export class ProfileAssets {
  private root: string;
  private baseUrl: string;
  private cache = new Map<string, ProfileCache>();
  private syncing = new Map<string, Promise<void>>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private problemListeners: Array<(profile: string, problem: string | null) => void> = [];

  constructor(dir: string, baseUrl = ASSET_BASE_URL) {
    this.root = join(dir, "assets");
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  }

  /** Called with a message when the active profile's set is incomplete, null once it is. */
  onProblem(listener: (profile: string, problem: string | null) => void): void {
    this.problemListeners.push(listener);
  }

  /**
   * Resolve a request path ("animations/<profile>/<file>") to a file on disk:
   * the cached profile file when the profile's set is complete, else the
   * default-pack equivalent from `distDir`. Null when this module does not own
   * the path (the caller then serves it from the UI bundle as before).
   */
  resolve(path: string, distDir: string): string | null {
    const parts = path.split("/");
    if (parts.length !== 3 || parts[0] !== "animations" || parts[1] === "default") return null;
    const profile = parts[1]!;
    const state = this.loadLocal(profile);
    const cached = join(this.root, profile, parts[2]!);
    if (state.complete && state.files.has(path) && existsSync(cached)) return cached;
    // A dev bundle built before profile media left the UI may still hold it.
    const bundled = join(distDir, path);
    if (existsSync(bundled)) return bundled;
    const fallback = defaultFor(path);
    return fallback ? join(distDir, fallback) : null;
  }

  /** Bring one profile's cache up to date with the bucket. Never throws. */
  sync(profile: string): Promise<void> {
    if (profile === "default") return Promise.resolve();
    const running = this.syncing.get(profile);
    if (running) return running;
    const job = this.runSync(profile)
      .catch((err) => {
        console.log(`Profile assets: sync for ${profile} failed:`, String(err));
      })
      .finally(() => {
        this.syncing.delete(profile);
        this.report(profile);
      });
    this.syncing.set(profile, job);
    return job;
  }

  /**
   * Keep the active profile synced: now, and again every few minutes while its
   * set is incomplete (a cart that boots before the venue network is up).
   */
  track(getActive: () => string): void {
    const tick = async () => {
      const profile = getActive();
      await this.sync(profile);
      if (this.retry) clearTimeout(this.retry);
      this.retry = null;
      if (profile !== "default" && !this.loadLocal(profile).complete) {
        this.retry = setTimeout(tick, RETRY_MS);
      }
    };
    void tick();
  }

  private report(profile: string): void {
    const state = this.loadLocal(profile);
    const problem = state.complete ? null : `Profile videos unavailable: ${profile}`;
    for (const l of this.problemListeners) l(profile, problem);
  }

  /** Read and verify the last applied manifest for a profile (cached in memory). */
  private loadLocal(profile: string): ProfileCache {
    const hit = this.cache.get(profile);
    if (hit) return hit;
    const state: ProfileCache = { complete: false, files: new Map() };
    const dir = join(this.root, profile);
    try {
      const raw = JSON.parse(readFileSync(join(dir, MANIFEST_FILE), "utf-8")) as AssetManifest;
      const files = Array.isArray(raw.files) ? raw.files : [];
      let ok = true;
      for (const e of files) {
        if (!isValidAssetEntry(profile, e)) {
          ok = false;
          continue;
        }
        state.files.set(e.path, e);
        if (ok && !this.verify(join(dir, e.path.split("/")[2]!), e)) ok = false;
      }
      state.complete = ok;
    } catch {
      // No manifest yet (never synced) or unreadable: not complete.
    }
    this.cache.set(profile, state);
    return state;
  }

  private verify(file: string, e: AssetEntry): boolean {
    try {
      if (!existsSync(file)) return false;
      const data = readFileSync(file);
      return data.byteLength === e.size && sha256(data) === e.sha256;
    } catch {
      return false;
    }
  }

  private async runSync(profile: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}manifests/${encodeURIComponent(profile)}.json`, {
      signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
      headers: { "cache-control": "no-cache" },
    });
    const dir = join(this.root, profile);
    if (res.status === 404) {
      // Profile has no media of its own: an empty set is complete.
      this.apply(profile, dir, { profile, generated: new Date().toISOString(), files: [] });
      return;
    }
    if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
    const manifest = (await res.json()) as AssetManifest;
    if (!manifest || !Array.isArray(manifest.files)) throw new Error("manifest malformed");
    const entries = manifest.files.filter((e) => isValidAssetEntry(profile, e));
    if (entries.length !== manifest.files.length) throw new Error("manifest has invalid entries");

    mkdirSync(dir, { recursive: true });
    let fetched = 0;
    for (const e of entries) {
      const target = join(dir, e.path.split("/")[2]!);
      if (this.verify(target, e)) continue;
      const fileRes = await fetch(`${this.baseUrl}${e.object}`, {
        signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
      });
      if (!fileRes.ok) throw new Error(`${e.path}: HTTP ${fileRes.status}`);
      const data = new Uint8Array(await fileRes.arrayBuffer());
      if (data.byteLength !== e.size || sha256(data) !== e.sha256) {
        throw new Error(`${e.path}: hash mismatch`);
      }
      const tmp = `${target}.part`;
      writeFileSync(tmp, data);
      renameSync(tmp, target);
      fetched++;
    }
    this.apply(profile, dir, { ...manifest, files: entries });
    console.log(
      `Profile assets: ${profile} up to date (${entries.length} files, ${fetched} downloaded)`
    );
  }

  /** Write the manifest last, so a crash mid-download never claims a complete set. */
  private apply(profile: string, dir: string, manifest: AssetManifest): void {
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `${MANIFEST_FILE}.part`);
    writeFileSync(tmp, JSON.stringify(manifest, null, 2));
    renameSync(tmp, join(dir, MANIFEST_FILE));
    this.cache.delete(profile);
    // Drop leftovers from an interrupted download.
    for (const e of manifest.files) {
      const part = join(dir, `${e.path.split("/")[2]!}.part`);
      if (existsSync(part)) {
        try {
          unlinkSync(part);
        } catch {}
      }
    }
  }
}
