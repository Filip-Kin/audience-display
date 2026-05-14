import { derived, get, writable } from "svelte/store";
import type { AudienceDisplayState } from "lib";
import { playSound } from "./audio";
import { settings } from "./settings";
import type { Screen } from "../../../lib/types/audience_display";
import { applyTheme, setActiveConfigName } from "./theme";

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
  eventConfig: null,
  availableConfigs: [],
  activeConfigName: null,
  configError: null,
};

let socket: WebSocket | null = null;
let lastConfigName: string | null = null;

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

      // Apply theme + register active config name when it changes.
      if (newState.activeConfigName !== lastConfigName) {
        lastConfigName = newState.activeConfigName;
        setActiveConfigName(newState.activeConfigName);
      }
      if (newState.eventConfig) {
        applyTheme(newState.eventConfig.theme);
      }
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

  return () => {
    socket?.close();
  };
});

export const eventConfig = derived(state, ($s) => $s.eventConfig);
export const availableConfigs = derived(state, ($s) => $s.availableConfigs);
export const activeConfigName = derived(state, ($s) => $s.activeConfigName);

export const setScreen = (screen: Screen) => {
  state.update((s) => {
    s.screen = screen;
    return s;
  });
};

export function sendSelectConfig(name: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "selectConfig", name }));
}
