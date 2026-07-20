// src/stores/settings.ts
import { writable } from "svelte/store";

export type Settings = {
  invert: boolean;
  top: boolean;
  matchReadySound: boolean;
  transitionAfterMatchEnd: number;
  showDisconnectedScreen: boolean;
};

const browser = typeof window !== "undefined";

// Params that were EXPLICITLY in the URL at load: a profile's settingsDefaults
// never override these (the operator pinned them on purpose).
const explicitParams = new Set<string>();

function parseQuerySettings(): Settings {
  if (!browser)
    return {
      invert: false,
      top: false,
      matchReadySound: true,
      transitionAfterMatchEnd: -1,
      showDisconnectedScreen: false,
    };
  const params = new URLSearchParams(window.location.search);
  for (const key of params.keys()) explicitParams.add(key);

  return {
    invert: params.get("inverted") === "true",
    top: params.get("top") === "true",
    matchReadySound: params.get("matchReadySound") === "true",
    transitionAfterMatchEnd: parseInt(
      params.get("transitionAfterMatchEnd") || "-1",
      10
    ),
    showDisconnectedScreen: params.get("showDisconnectedScreen") === "true",
  };
}

function updateQueryParams(settings: Settings) {
  if (!browser) return;
  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (settings.invert) {
    params.set("inverted", "true");
  } else {
    params.delete("inverted");
  }

  if (settings.top) {
    params.set("top", "true");
  } else {
    params.delete("top");
  }

  if (!settings.matchReadySound) {
    params.set("matchReadySound", "false");
  } else {
    params.delete("matchReadySound");
  }

  // 0 is a legal value (transition immediately); only the default -1 is omitted.
  if (settings.transitionAfterMatchEnd !== -1) {
    params.set(
      "transitionAfterMatchEnd",
      settings.transitionAfterMatchEnd.toString()
    );
  } else {
    params.delete("transitionAfterMatchEnd");
  }

  url.search = params.toString();
  window.history.replaceState({}, "", url.toString());
}

function createSettingsStore() {
  const initial = parseQuerySettings();
  const { subscribe, set, update } = writable<Settings>(initial);

  return {
    subscribe,
    set: (value: Settings) => {
      updateQueryParams(value);
      set(value);
    },
    update: (fn: (value: Settings) => Settings) => {
      update((current) => {
        const newValue = fn(current);
        updateQueryParams(newValue);
        return newValue;
      });
    },
  };
}

export const settings = createSettingsStore();

/**
 * Apply a profile's preferred settings defaults (called once whenever the
 * active profile changes). URL-pinned values always win.
 */
export function applyProfileDefaults(defaults?: { transitionAfterMatchEnd?: number }): void {
  if (!defaults) return;
  settings.update((s) => {
    const next = { ...s };
    if (
      defaults.transitionAfterMatchEnd !== undefined &&
      !explicitParams.has("transitionAfterMatchEnd")
    ) {
      next.transitionAfterMatchEnd = defaults.transitionAfterMatchEnd;
    }
    return next;
  });
}
