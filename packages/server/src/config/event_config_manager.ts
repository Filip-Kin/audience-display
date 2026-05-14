import { readdirSync, readFileSync, existsSync, watch, writeFileSync } from "fs";
import { join, basename, extname } from "path";
import type { EventConfig } from "lib";
import { validateEventConfig } from "./schema";

const ACTIVE_MARKER = ".active";
const DEFAULT_NAME = "default";

const DEFAULT_CONFIG: EventConfig = {
  name: "Default",
  event: {},
  theme: {
    primary: "#DC2626",
    secondary: "#2563EB",
    redAlliance: "#DC2626",
    blueAlliance: "#2563EB",
    accentWarn: "#FACC15",
    background: "#000000",
    surface: "#1F2937",
    text: "#FFFFFF",
  },
  assets: { sponsors: [] },
  animationPack: "default",
  layout: { logoPosition: "top-left", sponsorRotateMs: 5000 },
};

export type ConfigChange = {
  configs: string[];
  activeName: string;
  config: EventConfig;
  error: string | null;
};

export class EventConfigManager {
  private dir: string;
  private activeName: string;
  private activeConfig: EventConfig;
  private error: string | null = null;
  private listeners: Array<(change: ConfigChange) => void> = [];
  private watcher: ReturnType<typeof watch> | null = null;
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(dir: string) {
    this.dir = dir;
    this.ensureDefault();
    this.activeName = this.readActiveMarker();
    this.activeConfig = this.loadInternal(this.activeName) ?? DEFAULT_CONFIG;
    this.startWatching();
  }

  list(): string[] {
    try {
      return readdirSync(this.dir)
        .filter((f) => extname(f) === ".json")
        .map((f) => basename(f, ".json"))
        .sort();
    } catch {
      return [DEFAULT_NAME];
    }
  }

  active(): { name: string; config: EventConfig; error: string | null } {
    return { name: this.activeName, config: this.activeConfig, error: this.error };
  }

  setActive(name: string): void {
    const loaded = this.loadInternal(name);
    if (!loaded) return;
    this.activeName = name;
    this.activeConfig = loaded;
    this.error = null;
    try {
      writeFileSync(join(this.dir, ACTIVE_MARKER), name, "utf-8");
    } catch (err) {
      console.warn("Failed to persist active config marker", err);
    }
    this.notify();
  }

  resolveAsset(relativePath: string | undefined, name?: string): string | null {
    if (!relativePath) return null;
    const configName = name ?? this.activeName;
    return join(this.dir, configName, relativePath);
  }

  getDir(): string {
    return this.dir;
  }

  onChange(listener: (change: ConfigChange) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  dispose(): void {
    if (this.watcher) this.watcher.close();
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
  }

  private ensureDefault() {
    const defaultPath = join(this.dir, `${DEFAULT_NAME}.json`);
    if (!existsSync(defaultPath)) {
      try {
        writeFileSync(defaultPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
      } catch (err) {
        console.warn("Failed to seed default config", err);
      }
    }
  }

  private readActiveMarker(): string {
    const markerPath = join(this.dir, ACTIVE_MARKER);
    if (existsSync(markerPath)) {
      try {
        const name = readFileSync(markerPath, "utf-8").trim();
        if (name && existsSync(join(this.dir, `${name}.json`))) {
          return name;
        }
      } catch {}
    }
    return DEFAULT_NAME;
  }

  private loadInternal(name: string): EventConfig | null {
    const path = join(this.dir, `${name}.json`);
    if (!existsSync(path)) {
      this.error = `Config not found: ${name}.json`;
      console.warn(this.error);
      return null;
    }
    try {
      const raw = JSON.parse(readFileSync(path, "utf-8"));
      const result = validateEventConfig(raw);
      if (result.ok) {
        this.error = null;
        return result.config;
      }
      this.error = `Validation failed for ${name}.json: ${result.error}`;
      console.warn(this.error);
      return null;
    } catch (err) {
      this.error = `Parse error for ${name}.json: ${(err as Error).message}`;
      console.warn(this.error);
      return null;
    }
  }

  private startWatching() {
    try {
      this.watcher = watch(this.dir, (_eventType, filename) => {
        if (!filename) return;
        if (filename === ACTIVE_MARKER) return;
        if (this.reloadTimer) clearTimeout(this.reloadTimer);
        this.reloadTimer = setTimeout(() => this.handleFsChange(filename as string), 250);
      });
    } catch (err) {
      console.warn("Failed to start config watcher", err);
    }
  }

  private handleFsChange(filename: string) {
    // Re-broadcast list always (handles add/remove).
    // If the active file changed, reload it.
    const activeFile = `${this.activeName}.json`;
    if (filename === activeFile) {
      const reloaded = this.loadInternal(this.activeName);
      if (reloaded) {
        this.activeConfig = reloaded;
      }
    } else if (!existsSync(join(this.dir, activeFile))) {
      // Active file was deleted — fall back to default.
      const fallback = this.loadInternal(DEFAULT_NAME);
      if (fallback) {
        this.activeName = DEFAULT_NAME;
        this.activeConfig = fallback;
      }
    }
    this.notify();
  }

  private notify() {
    const change: ConfigChange = {
      configs: this.list(),
      activeName: this.activeName,
      config: this.activeConfig,
      error: this.error,
    };
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch (err) {
        console.warn("Config listener threw", err);
      }
    }
  }
}
