import type { EventConfig, EventConfigTheme } from "lib";

const VAR_MAP: Record<keyof EventConfigTheme, string> = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  redAlliance: "--color-red-alliance",
  blueAlliance: "--color-blue-alliance",
  accentWarn: "--color-accent-warn",
  background: "--color-background",
  surface: "--color-surface",
  text: "--color-text",
};

export function applyTheme(theme: EventConfigTheme): void {
  const root = document.documentElement;
  for (const [key, varName] of Object.entries(VAR_MAP) as Array<
    [keyof EventConfigTheme, string]
  >) {
    const value = theme[key];
    if (value) root.style.setProperty(varName, value);
  }
}

let currentConfigName: string | null = null;

export function setActiveConfigName(name: string | null): void {
  currentConfigName = name;
}

export function assetUrl(rel: string | undefined): string | undefined {
  if (!rel) return undefined;
  if (rel.startsWith("/") || /^https?:\/\//.test(rel)) return rel;
  if (!currentConfigName) return undefined;
  return `/configs/${currentConfigName}/${rel}`;
}
