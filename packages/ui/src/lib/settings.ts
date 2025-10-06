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

  if (settings.transitionAfterMatchEnd) {
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
