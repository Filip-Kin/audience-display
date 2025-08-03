import { get, writable } from "svelte/store";
import type { AudienceDisplayState } from "lib";
import { playSound } from "./audio";
import { settings } from "./settings";
import type { Screen } from "../../../lib/types/audience_display";

const defaultState: AudienceDisplayState = {
  connected: false,
  screen: "none",
  match: null,
  results: null,
  eventDetails: null,
  alliances: [],
  ranking: [],
};

// Subscribe to the state of the WebSocket connection.
// Automatically reconnects when the connection is lost.
export const state = writable(defaultState, (set) => {
  let reconnectInterval: Timer | null = null;
  let ws = new WebSocket(`ws://${location.host}/ws`);

  ws.onopen = () => {
    console.log("Connected to server!");
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
    }
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "state") {
      set(message.data);
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

  ws.onclose = () => {
    console.log("Disconnected from server!");
    set(defaultState);
    // Automatically reconnect when the connection is lost.
    // If the server is down, this will keep trying to reconnect.
    reconnectInterval = setTimeout(() => {
      ws = new WebSocket(`ws://${location.host}/ws`);
    }, 5000);
  };

  return () => {
    ws.close();
  };
});

export const setScreen = (screen: Screen) => {
  state.update((s) => {
    s.screen = screen;
    return s;
  });
};
