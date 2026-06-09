import { derived, get, writable } from "svelte/store";
import type { AudienceDisplayState } from "lib";
import { playSound } from "./audio";
import { settings } from "./settings";
import type { Screen } from "../../../lib/types/audience_display";
import { applyTheme } from "./theme";
import { displayEventName } from "./matchNamer";
import { getProfile, DEFAULT_PROFILE_ID } from "../profiles";

const defaultState: AudienceDisplayState = {
  connected: false,
  screen: "none",
  match: null,
  results: null,
  eventDetails: null,
  alliances: [],
  ranking: [],
  bracket: null,
  gameConfig: null,
  activeProfileId: null,
};

let socket: WebSocket | null = null;
let lastAppliedProfileId: string | null = null;

function applyProfileTheme(profileId: string | null) {
  const id = profileId ?? DEFAULT_PROFILE_ID;
  if (id === lastAppliedProfileId) return;
  lastAppliedProfileId = id;
  const profile = getProfile(id);
  applyTheme(profile.theme);
}

export const state = writable(defaultState, (set) => {
  let reconnectInterval: Timer | null = null;
  socket = new WebSocket(`ws://${location.host}/ws`);

  socket.onopen = () => {
    console.log("Connected to server!");
    if (reconnectInterval) clearInterval(reconnectInterval);
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "state") {
      const newState = message.data as AudienceDisplayState;
      set(newState);
      applyProfileTheme(newState.activeProfileId);
    }
    if (message.type === "sound") {
      console.log("Playing sound:", message.data);
      if (message.data === "matchReady" && !get(settings).matchReadySound) {
        console.log("Match ready sound is disabled in settings.");
      } else {
        playSound(message.data);
      }
    }
  };

  socket.onclose = () => {
    console.log("Disconnected from server!");
    set(defaultState);
    reconnectInterval = setTimeout(() => {
      socket = new WebSocket(`ws://${location.host}/ws`);
    }, 5000);
  };

  // Apply the default theme immediately so the UI isn't unthemed before the
  // first state message arrives.
  applyProfileTheme(null);

  return () => {
    socket?.close();
  };
});

export const activeProfileId = derived(state, ($s) => $s.activeProfileId);
export const activeProfile = derived(state, ($s) => getProfile($s.activeProfileId));
export const eventDisplayName = derived(
  [state, activeProfile],
  ([$s, $p]) => displayEventName($p.eventName || $s.eventDetails?.name)
);

export const setScreen = (screen: Screen) => {
  state.update((s) => {
    s.screen = screen;
    return s;
  });
};

export function sendSelectProfile(id: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "selectProfile", id }));
}
