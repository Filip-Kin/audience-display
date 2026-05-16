import type { ProfileTheme } from "lib";

const VAR_MAP: Record<keyof ProfileTheme, string> = {
  primary: "--color-primary",
  secondary: "--color-secondary",
  redAlliance: "--color-red-alliance",
  blueAlliance: "--color-blue-alliance",
  accentWarn: "--color-accent-warn",
  background: "--color-background",
  surface: "--color-surface",
  text: "--color-text",
};

export function applyTheme(theme: ProfileTheme): void {
  const root = document.documentElement;
  for (const [key, varName] of Object.entries(VAR_MAP) as Array<
    [keyof ProfileTheme, string]
  >) {
    const value = theme[key];
    if (value) root.style.setProperty(varName, value);
  }
}
