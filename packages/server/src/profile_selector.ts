import { dirname, join, resolve } from "path";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { profileIdForEventCode, type ProfileMeta } from "lib";

const DEFAULT_PROFILE_ID = "default";
const MARKER_FILE = ".active-profile";
// The FMS event code that last picked the profile automatically. Kept on disk so
// a manual pick made after it survives a restart: the same code coming back at
// boot is not a change.
const EVENT_MARKER_FILE = ".active-profile-event";

const isCompiledExe =
  process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");

/** Folder for per-install state: next to the exe, or the server package in dev. */
export function resolveMarkerDir(): string {
  if (isCompiledExe) {
    return dirname(process.execPath);
  }
  // Dev: place at repo root if discoverable, else cwd.
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "..", ".."),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "packages")) || existsSync(join(candidate, "package.json"))) {
      return candidate;
    }
  }
  return process.cwd();
}

export type ProfileSource = "event" | "manual" | "default";

export type ProfileSelection = { id: string; source: ProfileSource };

/**
 * The active profile and why it is active. Auto-selection by FMS event code:
 * when the code becomes known or changes and exactly one profile lists it, that
 * profile is selected. A manual pick after that stands until the code changes
 * again. No match leaves the selection alone.
 */
export class ProfileSelector {
  private path: string;
  private eventPath: string;
  private id: string;
  private source: ProfileSource;
  /** Upper-cased code that made the last automatic pick, or null. */
  private autoCode: string | null;
  private profiles: ProfileMeta[] | undefined;
  private listeners: Array<(id: string, source: ProfileSource) => void> = [];
  private errorListeners: Array<(message: string) => void> = [];

  constructor(opts: { dir?: string; profiles?: ProfileMeta[] } = {}) {
    const dir = opts.dir ?? resolveMarkerDir();
    this.path = join(dir, MARKER_FILE);
    this.eventPath = join(dir, EVENT_MARKER_FILE);
    this.profiles = opts.profiles;
    const stored = this.readFile(this.path);
    this.autoCode = this.readFile(this.eventPath)?.toUpperCase() ?? null;
    this.id = stored ?? DEFAULT_PROFILE_ID;
    this.source = !stored
      ? "default"
      : this.autoCode && profileIdForEventCode(this.autoCode, this.profiles) === stored
        ? "event"
        : "manual";
  }

  get(): string {
    return this.id;
  }

  getSelection(): ProfileSelection {
    return { id: this.id, source: this.source };
  }

  /** Operator pick (settings page, display WebSocket). */
  set(id: string): void {
    this.apply(id, "manual");
  }

  /**
   * Feed an FMS event code (from FMS or from AV Assistant). Returns the profile
   * id it selected, or null when it left the selection alone.
   */
  applyEventCode(code: string | null | undefined): string | null {
    const upper = code?.trim().toUpperCase();
    if (!upper || upper === this.autoCode) return null;
    const match = profileIdForEventCode(upper, this.profiles);
    this.autoCode = match ? upper : null;
    this.persist(this.eventPath, this.autoCode);
    if (!match) return null;
    this.apply(match, "event");
    return match;
  }

  onChange(listener: (id: string, source: ProfileSource) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  onError(listener: (message: string) => void): void {
    this.errorListeners.push(listener);
  }

  private apply(id: string, source: ProfileSource): void {
    if (!id || (id === this.id && source === this.source)) return;
    const idChanged = id !== this.id;
    this.id = id;
    this.source = source;
    if (idChanged) this.persist(this.path, id);
    for (const listener of this.listeners) {
      try {
        listener(id, source);
      } catch (err) {
        console.warn("Profile listener threw", err);
      }
    }
  }

  private persist(path: string, value: string | null): void {
    try {
      if (value) writeFileSync(path, value, "utf-8");
      else if (existsSync(path)) unlinkSync(path);
    } catch (err) {
      console.warn(`Failed to persist ${path}`, err);
      for (const l of this.errorListeners) l("Profile save failed");
    }
  }

  private readFile(path: string): string | null {
    if (existsSync(path)) {
      try {
        const v = readFileSync(path, "utf-8").trim();
        if (v) return v;
      } catch (err) {
        console.warn(`Failed to read ${path}`, err);
      }
    }
    return null;
  }
}
