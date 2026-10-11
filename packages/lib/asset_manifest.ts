/**
 * Per-profile heavy media (victory videos and their loading cover) is not
 * bundled into the exe. It lives in a public GCS bucket and the server
 * downloads only the active profile's files into a cache next to the exe.
 *
 * Bucket layout (written by tools/publish-assets.ts):
 *   manifests/<profile>.json      no-cache, rewritten on every publish
 *   files/<sha256>.<ext>          immutable, content-addressed
 *
 * A manifest maps each served URL path (e.g. "animations/wrc/redwins.mp4",
 * the same path the UI requests) to the content-addressed object holding it.
 * Replacing a video is: drop the new file in packages/ui/public/animations/<id>/
 * and publish again. Old objects stay in the bucket, harmless, so an older exe
 * that still has a previous manifest cached keeps working.
 */

export const ASSET_BUCKET = "filipkin-ad-assets";
export const ASSET_BASE_URL = `https://storage.googleapis.com/${ASSET_BUCKET}/`;

export type AssetEntry = {
  /** URL path served to the UI, no leading slash: "animations/<profile>/<file>". */
  path: string;
  size: number;
  sha256: string;
  /** Bucket object key: "files/<sha256>.<ext>". */
  object: string;
};

export type AssetManifest = {
  profile: string;
  generated: string;
  files: AssetEntry[];
};

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Only accept entries that stay inside the profile's own animations folder and
 * point at a content-addressed object, so a bad manifest can never write
 * outside the cache or overwrite another profile's files.
 */
export function isValidAssetEntry(profile: string, e: unknown): e is AssetEntry {
  if (!e || typeof e !== "object") return false;
  const { path, size, sha256, object } = e as Record<string, unknown>;
  if (typeof path !== "string" || typeof object !== "string") return false;
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return false;
  if (typeof sha256 !== "string" || !/^[0-9a-f]{64}$/.test(sha256)) return false;
  const parts = path.split("/");
  if (parts.length !== 3 || parts[0] !== "animations" || parts[1] !== profile) return false;
  if (!SAFE_NAME.test(parts[2]!)) return false;
  return object.startsWith(`files/${sha256}`) && SAFE_NAME.test(object.slice("files/".length));
}
