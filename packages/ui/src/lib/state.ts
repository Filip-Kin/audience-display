import { readable } from "svelte/store";
import type { AudienceDisplayState } from "lib";
import { playSound } from "./audio";

const defaultState: AudienceDisplayState = {
  connected: false,
  screen: "none",
  match: null,
  eventDetails: null,
};

// Subscribe to the state of the WebSocket connection.
// Automatically reconnects when the connection is lost.
export const state = readable(defaultState, (set) => {
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
      playSound(message.data);
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
