import { readable } from "svelte/store";
import type { AudienceDisplayState } from "lib";

const defaultState: AudienceDisplayState = {
  connected: false,
  screen: "none",
  match: null,
  eventDetails: null,
};

// Subscribe to the state of the WebSocket connection.
// Automatically reconnects when the connection is lost.
export const state = readable(defaultState, (set) => {
  let ws = new WebSocket(`ws://${location.host}/ws`);

  ws.onopen = () => {
    console.log("Connected to server!");
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    set(message);
  };

  ws.onclose = () => {
    console.log("Disconnected from server!");
    set(defaultState);
    setTimeout(() => {
      ws = new WebSocket(`ws://${location.host}/ws`);
    }, 1000);
  };

  return () => {
    ws.close();
  };
});
