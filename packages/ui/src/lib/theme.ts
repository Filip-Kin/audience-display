import type { ProfileTheme } from "lib";

const VAR_MAP: Record<keyof ProfileTheme, string> = {
  primary: "--primary",
  secondary: "--secondary",
  redAlliance: "--redAlliance",
  blueAlliance: "--blueAlliance",
  accentWarn: "--accentWarn",
  background: "--background",
  surface: "--surface",
  text: "--text",
  scoreBarAccent: "--scoreBarAccent",
  matchLabel: "--matchLabel",
};

export function applyTheme(theme: ProfileTheme): void {
  const root = document.documentElement;
  for (const [key, varName] of Object.entries(VAR_MAP) as Array<
    [keyof ProfileTheme, string]
  >) {
    const value = theme[key];
    // Clear optional vars a profile omits, so switching profiles can't leave a
    // previous profile's override (e.g. scoreBarAccent) stuck on :root.
    if (value) root.style.setProperty(varName, value);
    else root.style.removeProperty(varName);
  }
}
