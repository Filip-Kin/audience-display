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

/** oklch(L C H) or oklch(L C H / A) -> linear-light sRGB, for a contrast check. */
function oklchToLinearRgb(value: string): [number, number, number] | null {
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/i.exec(value.trim());
  if (!m) return null;
  const L = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const h = (parseFloat(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, mm = m_ ** 3, ss = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss,
  ];
}

function relativeLuminance(value: string): number | null {
  if (value === "white") return 1;
  if (value === "black") return 0;
  const rgb = oklchToLinearRgb(value);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => Math.max(0, Math.min(1, c)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Shout about a theme that will not read on a projector. Nothing in the repo
 * used to check this, so every contrast bug (the MARC red accent, the fuel gauge
 * vanishing into the red alliance, ranking-point badges lost in the shutter) was
 * found at an event instead of at build time. Console only, never throws: a
 * questionable theme must still put a picture on the wall.
 *
 * Thresholds come from offseason-profile-designs/THEME-RULES.md.
 */
function warnAboutTheme(theme: ProfileTheme): void {
  const say = (msg: string) => console.error("[theme] " + msg);
  const ratio = (a: string, b: string, floor: number, what: string) => {
    const c = contrast(a, b);
    if (c !== null && c < floor) say(`${what}: ${c.toFixed(2)}:1, want ${floor}:1 or better`);
  };

  // Everything drawn on an alliance colour is hardcoded text-white.
  ratio("white", theme.redAlliance, 4.5, "white on redAlliance");
  ratio("white", theme.blueAlliance, 4.5, "white on blueAlliance");

  // The shutter sits behind team cards and ranking-point badges tinted with the
  // alliance colours. "Darker" is not enough; it has to be darker by a ratio.
  ratio(theme.primary, theme.redAlliance, 3, "primary shutter vs redAlliance");
  ratio(theme.secondary, theme.blueAlliance, 3, "secondary shutter vs blueAlliance");

  // accentWarn draws the fuel-gauge arc and the score-bar trim straight on the
  // alliance halves. scoreBarAccent is the escape hatch when it does not clear.
  const barAccent = theme.scoreBarAccent ?? theme.accentWarn;
  ratio(barAccent, theme.redAlliance, 3, "score-bar accent on redAlliance");
  ratio(barAccent, theme.blueAlliance, 3, "score-bar accent on blueAlliance");

  // accentWarn is also a light background under hardcoded dark ink at ~14 sites.
  const accentL = /^oklch\(\s*([\d.]+)/.exec(theme.accentWarn.trim());
  if (accentL && parseFloat(accentL[1]) < 0.75) {
    say(`accentWarn is dark (L ${accentL[1]}); it is the FRC attention yellow and carries dark ink`);
  }
}

export function applyTheme(theme: ProfileTheme): void {
  warnAboutTheme(theme);
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
