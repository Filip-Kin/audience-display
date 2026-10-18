import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tbaEntries, tbaSig, type Award, type AwardWinner, type TbaAwardEntry, type TbaCredentialsStatus } from "lib";
import { appDataDir } from "./fms_logger";

// Awards for the award lower third. The list is ours, typed on the Awards page:
// offseason events give out awards FMS does not know, so FMS awards are not
// read. Kept in settings.json per profile, like team names, because every event
// runs its own profile and one event's awards must not follow the laptop to the
// next one:
//   { "awards": { "bgrc": [ { "id": "...", "name": "Winner", ... } ] },
//     "awardsTba": { "bgrc": { "eventKey": "2026mibg", "authId": "...", "secret": "..." } } }

// #region settings.json persistence
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

function readByProfile<T>(key: string): Record<string, T> {
  const raw = readSettings()[key];
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, T>) : {};
}
// #endregion

type TbaCredentials = { eventKey: string; authId: string; secret: string };

let awardsByProfile: Record<string, Award[]> = {};
let tbaByProfile: Record<string, TbaCredentials> = {};
let activeProfile: () => string = () => "default";

export function initAwards(getProfileId: () => string): void {
  activeProfile = getProfileId;
  awardsByProfile = readByProfile<Award[]>("awards");
  tbaByProfile = readByProfile<TbaCredentials>("awardsTba");
}

// #region award list
export function listAwards(): Award[] {
  const list = awardsByProfile[activeProfile()];
  return Array.isArray(list) ? list : [];
}

export function findAward(id: string): Award | undefined {
  return listAwards().find((a) => a.id === id);
}

/** An empty winner is kept: it is a slot the operator has not filled in yet,
 *  and dropping it made the row vanish from the Awards page on the next state. */
function cleanWinner(w: unknown): AwardWinner {
  const o = (w ?? {}) as Record<string, unknown>;
  const team = Number(o.team);
  const person = typeof o.person === "string" ? o.person.trim() : "";
  const out: AwardWinner = {};
  if (Number.isInteger(team) && team > 0) out.team = team;
  if (person) out.person = person;
  return out;
}

function cleanAward(a: unknown): Award | null {
  const o = (a ?? {}) as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id ? o.id.slice(0, 64) : crypto.randomUUID();
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const type = Number(o.tbaType);
  const sponsor = typeof o.sponsor === "string" ? o.sponsor.trim() : "";
  // Rows with no name and no winners are blanks the operator has not filled in
  // yet; keep them so the editor does not eat a half-typed award.
  const winners = (Array.isArray(o.winners) ? o.winners : []).map(cleanWinner);
  return {
    id,
    name,
    tbaType: o.tbaType === null || o.tbaType === undefined || o.tbaType === "" || !Number.isInteger(type) ? null : type,
    ...(sponsor ? { sponsor } : {}),
    ...(sponsor && o.sponsorLight === true ? { sponsorLight: true } : {}),
    winners,
  };
}

/** Replace the active profile's award list (the Awards page sends it whole).
 *  The TBA publish record is the server's, never the page's: a page copy sent
 *  just after a publish would otherwise wipe it. */
export function saveAwards(list: unknown): Award[] {
  const published = new Map(listAwards().map((a) => [a.id, a.publishedSig]));
  const awards = (Array.isArray(list) ? list : [])
    .map(cleanAward)
    .filter((a): a is Award => !!a)
    .map((a) => {
      const sig = published.get(a.id);
      return sig ? { ...a, publishedSig: sig } : a;
    });
  return setAwards(awards);
}

function setAwards(awards: Award[]): Award[] {
  const next = { ...awardsByProfile };
  if (awards.length) next[activeProfile()] = awards;
  else delete next[activeProfile()];
  awardsByProfile = next;
  mergeSettings({ awards: awardsByProfile });
  return awards;
}
// #endregion

// #region sponsor logos
// Uploaded sponsor logos live next to settings.json and are served at
// /award-logos/<sha>.<ext>. Content-addressed, so a re-upload is free and the
// URL never serves stale art.
const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
export const logoDir = () => join(appDataDir(), "award-logos");

export function saveAwardLogo(dataUrl: string): string {
  const m = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!m || !LOGO_TYPES[m[1]]) throw new Error("PNG, JPEG, WebP or SVG image required");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > 8 * 1024 * 1024) throw new Error("Image over 8 MB");
  const name = `${createHash("sha256").update(bytes).digest("hex").slice(0, 20)}.${LOGO_TYPES[m[1]]}`;
  mkdirSync(logoDir(), { recursive: true });
  const path = join(logoDir(), name);
  if (!existsSync(path)) writeFileSync(path, bytes);
  return `/award-logos/${name}`;
}

/** File path for a /award-logos/ request, or null for anything that is not a
 *  plain file name (no path tricks). */
export function awardLogoPath(pathname: string): string | null {
  const name = pathname.slice("/award-logos/".length);
  if (!/^[a-f0-9]{20}\.(png|jpg|webp|svg)$/.test(name)) return null;
  const path = join(logoDir(), name);
  return existsSync(path) ? path : null;
}
// #endregion

// #region TBA
// Credentials come from the Awards page first. Under FIM-AV Assistant the
// event's TBA key is already in its upload settings (the YouTube uploader uses
// it for match videos), so that is read as the fallback: the same key works for
// awards when it was granted the "event awards" permission.
function fimavCredentials(): TbaCredentials | null {
  const appData = process.env.APPDATA;
  if (!appData) return null;
  try {
    const cfg = JSON.parse(readFileSync(join(appData, "us.fimav.assistant", "config.json"), "utf-8"));
    const u = cfg?.upload ?? {};
    if (typeof u.tbaAuthId === "string" && typeof u.tbaSecret === "string" && u.tbaAuthId && u.tbaSecret) {
      return { eventKey: typeof u.tbaEventKey === "string" ? u.tbaEventKey : "", authId: u.tbaAuthId, secret: u.tbaSecret };
    }
  } catch {
    // Not running under AV Assistant, or no upload settings yet.
  }
  return null;
}

function ownCredentials(): TbaCredentials | null {
  const c = tbaByProfile[activeProfile()];
  return c && c.authId && c.secret ? c : null;
}

function resolveCredentials(): (TbaCredentials & { source: "awards" | "fimav" }) | null {
  const own = ownCredentials();
  if (own) return { ...own, source: "awards" };
  const av = fimavCredentials();
  if (av) return { ...av, source: "fimav" };
  return null;
}

export function tbaStatus(): TbaCredentialsStatus {
  const c = resolveCredentials();
  const typedKey = tbaByProfile[activeProfile()]?.eventKey ?? "";
  if (!c) return { eventKey: typedKey, authId: "", hasSecret: false, source: "none" };
  return { eventKey: typedKey || c.eventKey, authId: c.authId, hasSecret: true, source: c.source };
}

/** Save the Awards page's TBA fields. An empty secret keeps the stored one, so
 *  the browser never needs to see it again after the first save. */
export function saveTbaCredentials(body: { eventKey?: unknown; authId?: unknown; secret?: unknown; clear?: unknown }): TbaCredentialsStatus {
  const prev = tbaByProfile[activeProfile()] ?? { eventKey: "", authId: "", secret: "" };
  const next = { ...tbaByProfile };
  if (body.clear === true) {
    delete next[activeProfile()];
  } else {
    next[activeProfile()] = {
      eventKey: typeof body.eventKey === "string" ? body.eventKey.trim().toLowerCase() : prev.eventKey,
      authId: typeof body.authId === "string" ? body.authId.trim() : prev.authId,
      secret: typeof body.secret === "string" && body.secret.trim() ? body.secret.trim() : prev.secret,
    };
  }
  tbaByProfile = next;
  mergeSettings({ awardsTba: tbaByProfile });
  return tbaStatus();
}

/**
 * Publish to TBA. TBA replaces every award on the event with each push, so a
 * push always sends every award published so far plus the ones being
 * published now (`ids`, or every award that can go to TBA with `all`).
 * Signed the same way as the uploader's match-video posts:
 * md5(secret + path + body). On success each sent award records what TBA now
 * holds for it; an award that can no longer go to TBA (type cleared, winners
 * emptied) is dropped from TBA by the same push and loses its record.
 */
export async function publishAwards(opts: {
  ids?: string[];
  all?: boolean;
  eventKey?: string;
}): Promise<{ ok: boolean; status: number; message: string; sent: number }> {
  const c = resolveCredentials();
  if (!c) return { ok: false, status: 0, message: "No TBA key", sent: 0 };
  const eventKey = (opts.eventKey || tbaByProfile[activeProfile()]?.eventKey || c.eventKey || "").trim().toLowerCase();
  if (!/^\d{4}[a-z0-9]+$/.test(eventKey)) return { ok: false, status: 0, message: "No TBA event key", sent: 0 };

  const awards = listAwards();
  const wanted = new Set(opts.ids ?? []);
  const sending = awards.filter((a) => tbaEntries(a).length && (opts.all || a.publishedSig || wanted.has(a.id)));
  const entries: TbaAwardEntry[] = sending.flatMap(tbaEntries);
  const body = JSON.stringify(entries);
  const path = `/api/trusted/v1/event/${eventKey}/awards/update`;
  const sig = createHash("md5").update(c.secret + path + body).digest("hex");
  const base = process.env.TBA_URL || "https://www.thebluealliance.com";
  try {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "content-type": "application/json", "X-TBA-Auth-Id": c.authId, "X-TBA-Auth-Sig": sig },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    const text = (await res.text()).slice(0, 500);
    if (res.ok) {
      const sent = new Set(sending.map((a) => a.id));
      setAwards(
        awards.map((a) => {
          const { publishedSig: _, ...rest } = a;
          return sent.has(a.id) ? { ...rest, publishedSig: tbaSig(a) } : rest;
        })
      );
    }
    return { ok: res.ok, status: res.status, message: text, sent: entries.length };
  } catch (e) {
    return { ok: false, status: 0, message: String(e), sent: 0 };
  }
}
// #endregion
