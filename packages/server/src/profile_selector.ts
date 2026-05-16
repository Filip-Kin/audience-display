import { dirname, join, resolve } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

const DEFAULT_PROFILE_ID = "default";
const MARKER_FILE = ".active-profile";

const isCompiledExe =
  process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");

function resolveMarkerPath(): string {
  if (isCompiledExe) {
    return join(dirname(process.execPath), MARKER_FILE);
  }
  // Dev: place at repo root if discoverable, else cwd.
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "..", ".."),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "packages")) || existsSync(join(candidate, "package.json"))) {
      return join(candidate, MARKER_FILE);
    }
  }
  return join(process.cwd(), MARKER_FILE);
}

export class ProfileSelector {
  private path: string;
  private id: string;
  private listeners: Array<(id: string) => void> = [];

  constructor() {
    this.path = resolveMarkerPath();
    this.id = this.read();
  }

  get(): string {
    return this.id;
  }

  set(id: string): void {
    if (!id || id === this.id) return;
    this.id = id;
    try {
      writeFileSync(this.path, id, "utf-8");
    } catch (err) {
      console.warn("Failed to persist active profile", err);
    }
    for (const listener of this.listeners) {
      try {
        listener(id);
      } catch (err) {
        console.warn("Profile listener threw", err);
      }
    }
  }

  onChange(listener: (id: string) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private read(): string {
    if (existsSync(this.path)) {
      try {
        const id = readFileSync(this.path, "utf-8").trim();
        if (id) return id;
      } catch {}
    }
    return DEFAULT_PROFILE_ID;
  }
}
