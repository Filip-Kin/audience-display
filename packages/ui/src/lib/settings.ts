// src/stores/settings.ts
import { writable } from "svelte/store";

export type Settings = {
  invert: boolean;
  top: boolean;
  matchReadySound: boolean;
  transitionAfterMatchEnd: number;
  showDisconnectedScreen: boolean;
  /** Show team avatars on the score bar's team-number pills. */
  scoreBarAvatars: boolean;
  /** Freeze the score bar's scores the moment the match clock hits zero, so
   *  post-match referee edits never repaint the audience's final score. */
  freezeScoresAtEnd: boolean;
};

const browser = typeof window !== "undefined";

// Params that were EXPLICITLY in the URL at load: a profile's settingsDefaults
// never override these (the operator pinned them on purpose).
const explicitParams = new Set<string>();

// What a reload WITHOUT the URL param would resolve to: -1 until the active
// profile ships a default (e.g. RR's 3). The URL keeps transitionAfterMatchEnd
// whenever the current value differs from this, so a pinned -1 survives under
// a profile whose default is not -1.
let profileDefaultTransition = -1;

function parseQuerySettings(): Settings {
  if (!browser)
    return {
      invert: false,
      top: false,
      matchReadySound: true,
      transitionAfterMatchEnd: -1,
      showDisconnectedScreen: false,
      scoreBarAvatars: false,
      freezeScoresAtEnd: true,
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
    scoreBarAvatars: params.get("scoreBarAvatars") === "true",
    // Default-true: only an explicit =false disables (a missing param must not
    // read as false, unlike the matchReadySound quirk).
    freezeScoresAtEnd: params.get("freezeScoresAtEnd") !== "false",
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

  if (settings.scoreBarAvatars) {
    params.set("scoreBarAvatars", "true");
  } else {
    params.delete("scoreBarAvatars");
  }

  if (!settings.freezeScoresAtEnd) {
    params.set("freezeScoresAtEnd", "false");
  } else {
    params.delete("freezeScoresAtEnd");
  }

  // 0 is a legal value (transition immediately); only the value a paramless
  // reload would produce anyway is omitted.
  if (settings.transitionAfterMatchEnd !== profileDefaultTransition) {
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
  if (defaults.transitionAfterMatchEnd !== undefined) {
    // Track the ambient default even when a URL pin wins, so updateQueryParams
    // knows which value can be safely omitted from the URL.
    profileDefaultTransition = defaults.transitionAfterMatchEnd;
  }
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
