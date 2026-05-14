import { dirname, join, resolve } from "path";
import { mkdirSync, existsSync } from "fs";

const isCompiledExe =
  process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe");

export function resolveConfigsDir(): string {
  // When running as a compiled exe, look next to the exe.
  if (isCompiledExe) {
    const dir = join(dirname(process.execPath), "configs");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  // In dev, prefer the repo-root configs/ if it exists; this is the git-tracked
  // location and the natural place for example configs. Walk up to two levels
  // from cwd (typically packages/server) looking for it.
  const candidates = [
    process.cwd(),
    resolve(process.cwd(), ".."),
    resolve(process.cwd(), "..", ".."),
  ];
  for (const candidate of candidates) {
    const dir = join(candidate, "configs");
    if (existsSync(dir)) return dir;
  }

  // Nothing found — create it at cwd.
  const dir = join(process.cwd(), "configs");
  mkdirSync(dir, { recursive: true });
  return dir;
}
