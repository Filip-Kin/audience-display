import type { EventConfig, LogoPosition } from "lib";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

const LOGO_POSITIONS: ReadonlySet<LogoPosition> = new Set([
  "top-left",
  "top-right",
  "top-center",
  "bottom-left",
  "bottom-right",
]);

function isString(v: unknown): v is string {
  return typeof v === "string";
}
function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isHex(v: unknown): v is string {
  return isString(v) && HEX_RE.test(v);
}

export type ValidationResult =
  | { ok: true; config: EventConfig }
  | { ok: false; error: string };

export function validateEventConfig(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "config must be an object" };
  }
  const c = raw as Record<string, unknown>;

  if (!isString(c.name)) return { ok: false, error: "missing string `name`" };

  const event = (c.event ?? {}) as Record<string, unknown>;
  if (event.nameOverride !== undefined && !isString(event.nameOverride)) {
    return { ok: false, error: "event.nameOverride must be a string" };
  }
  if (event.matchCountOverride !== undefined && !isNumber(event.matchCountOverride)) {
    return { ok: false, error: "event.matchCountOverride must be a number" };
  }

  const theme = c.theme as Record<string, unknown> | undefined;
  if (!theme) return { ok: false, error: "missing `theme` object" };
  const themeKeys: (keyof EventConfig["theme"])[] = [
    "primary",
    "secondary",
    "redAlliance",
    "blueAlliance",
    "accentWarn",
    "background",
    "surface",
    "text",
  ];
  for (const key of themeKeys) {
    if (!isHex(theme[key])) {
      return { ok: false, error: `theme.${key} must be a 6-digit hex color (got ${JSON.stringify(theme[key])})` };
    }
  }

  const assets = (c.assets ?? {}) as Record<string, unknown>;
  if (assets.logo !== undefined && !isString(assets.logo)) {
    return { ok: false, error: "assets.logo must be a string path" };
  }
  if (assets.logoSecondary !== undefined && !isString(assets.logoSecondary)) {
    return { ok: false, error: "assets.logoSecondary must be a string path" };
  }
  if (assets.backgroundImage !== undefined && !isString(assets.backgroundImage)) {
    return { ok: false, error: "assets.backgroundImage must be a string path" };
  }
  const sponsors = assets.sponsors ?? [];
  if (!Array.isArray(sponsors) || !sponsors.every(isString)) {
    return { ok: false, error: "assets.sponsors must be a string array" };
  }

  if (!isString(c.animationPack)) {
    return { ok: false, error: "animationPack must be a string" };
  }

  const layout = c.layout as Record<string, unknown> | undefined;
  if (!layout) return { ok: false, error: "missing `layout` object" };
  if (!LOGO_POSITIONS.has(layout.logoPosition as LogoPosition)) {
    return {
      ok: false,
      error: `layout.logoPosition must be one of: ${[...LOGO_POSITIONS].join(", ")}`,
    };
  }
  if (!isNumber(layout.sponsorRotateMs) || layout.sponsorRotateMs <= 0) {
    return { ok: false, error: "layout.sponsorRotateMs must be a positive number" };
  }

  const normalized: EventConfig = {
    name: c.name,
    event: {
      nameOverride: isString(event.nameOverride) ? event.nameOverride : undefined,
      matchCountOverride: isNumber(event.matchCountOverride) ? event.matchCountOverride : undefined,
    },
    theme: {
      primary: theme.primary as string,
      secondary: theme.secondary as string,
      redAlliance: theme.redAlliance as string,
      blueAlliance: theme.blueAlliance as string,
      accentWarn: theme.accentWarn as string,
      background: theme.background as string,
      surface: theme.surface as string,
      text: theme.text as string,
    },
    assets: {
      logo: isString(assets.logo) ? assets.logo : undefined,
      logoSecondary: isString(assets.logoSecondary) ? assets.logoSecondary : undefined,
      sponsors: sponsors as string[],
      backgroundImage: isString(assets.backgroundImage) ? assets.backgroundImage : undefined,
    },
    animationPack: c.animationPack,
    layout: {
      logoPosition: layout.logoPosition as LogoPosition,
      sponsorRotateMs: layout.sponsorRotateMs,
    },
  };

  return { ok: true, config: normalized };
}
