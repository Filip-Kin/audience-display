import { derived, get, writable } from "svelte/store";
import type { AudienceDisplayState } from "lib";
import { playSound } from "./audio";
import { settings, applyProfileDefaults } from "./settings";
import type { Screen } from "../../../lib/types/audience_display";
import { applyTheme } from "./theme";
import { displayEventName } from "./matchNamer";
import { getProfile, DEFAULT_PROFILE_ID } from "../profiles";

let appliedDefaultsFor: string | null = null;

const defaultState: AudienceDisplayState = {
  connected: false,
  screen: "none",
  match: null,
  results: null,
  eventDetails: null,
  alliances: [],
  ranking: [],
  allianceSize: 3,
  pickTimerType: "pick",
  rankData: [],
  bracket: null,
  firstPlayoffMatchTime: null,
  gameConfig: null,
  activeProfileId: null,
  fmsLogging: true,
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
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  // Every (re)connection goes through here so each socket gets the full set of
  // handlers, and every close (including failed reconnect attempts) reschedules
  // another attempt.
  function connect() {
    const ws = new WebSocket(`ws://${location.host}/ws`);
    socket = ws;

    ws.onopen = () => {
      console.log("Connected to server!");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        const newState = message.data as AudienceDisplayState;
        set(newState);
        applyProfileTheme(newState.activeProfileId);
        // Profile settings defaults apply ONCE per profile change - state
        // broadcasts arrive every second and must not clobber modal edits.
        const pid = newState.activeProfileId ?? DEFAULT_PROFILE_ID;
        if (pid !== appliedDefaultsFor) {
          appliedDefaultsFor = pid;
          applyProfileDefaults(getProfile(pid).settingsDefaults);
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

    ws.onerror = (event) => {
      console.log("Websocket error:", event);
    };

    ws.onclose = () => {
      console.log("Disconnected from server!");
      set(defaultState);
      if (stopped) return;
      reconnectTimeout = setTimeout(connect, 5000);
    };
  }

  connect();

  // Apply the default theme immediately so the UI isn't unthemed before the
  // first state message arrives.
  applyProfileTheme(null);

  return () => {
    stopped = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    socket?.close();
    socket = null;
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

export function sendSetFmsLogging(on: boolean): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: "setFmsLogging", on }));
}
