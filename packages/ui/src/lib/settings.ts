// src/stores/settings.ts
import { writable } from "svelte/store";

export type Settings = {
  invert: boolean;
  top: boolean;
};

const browser = typeof window !== "undefined";

function parseQuerySettings(): Settings {
  if (!browser) return { invert: false, top: false };
  const params = new URLSearchParams(window.location.search);

  return {
    invert: params.get("inverted") === "true",
    top: params.get("top") === "true"
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
    }
  };
}

export const settings = createSettingsStore();
