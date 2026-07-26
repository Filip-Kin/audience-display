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

// #region Exit-transition data freeze
// While a screen slides out it must keep showing the data it exited with -
// otherwise a repost swaps new results into the still-visible screen mid
// animation. The router freezes on exit start and unfreezes once the swap is
// done; screen/connection/profile fields always pass through so screen
// commands are never delayed.
let frozenData: AudienceDisplayState | null = null;
let bufferedWhileFrozen: AudienceDisplayState | null = null;

function applyProfileTheme(profileId: string | null) {
  const id = profileId ?? DEFAULT_PROFILE_ID;
  if (id === lastAppliedProfileId) return;
  lastAppliedProfileId = id;
  const profile = getProfile(id);
  applyTheme(profile.theme);
}

export const state = writable(defaultState, (set) => {
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let watchdog: ReturnType<typeof setInterval> | null = null;
  let lastMessageAt = 0;
  let stopped = false;

  // Every (re)connection goes through here so each socket gets the full set of
  // handlers, and every close (including failed reconnect attempts) reschedules
  // another attempt.
  function connect() {
    const ws = new WebSocket(`ws://${location.host}/ws`);
    socket = ws;
    lastMessageAt = Date.now();

    // An attempt to an unreachable host can hang in CONNECTING for the OS TCP
    // timeout (20s+); abort it so retries keep their ~1s cadence.
    const connectTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) ws.close();
    }, 4000);

    ws.onopen = () => {
      console.log("Connected to server!");
      clearTimeout(connectTimeout);
      lastMessageAt = Date.now();
      serverConnected.set(true);
    };

    ws.onmessage = (event) => {
      lastMessageAt = Date.now();
      const message = JSON.parse(event.data);
      if (message.type === "state") {
        const newState = message.data as AudienceDisplayState;
        // The exe auto-updates and restarts with a new bundle; a display that
        // stayed open keeps its old UI until reloaded. When the server reports a
        // version different from this build, reload once to pick up the new bundle.
        // (Guarded per version so a stale server can't cause a reload loop.)
        if (
          newState.version &&
          newState.version !== __APP_VERSION__ &&
          sessionStorage.getItem("reloadedForVersion") !== newState.version
        ) {
          console.log(`Server version ${newState.version} != client ${__APP_VERSION__}; reloading`);
          sessionStorage.setItem("reloadedForVersion", newState.version);
          location.reload();
          return;
        }
        if (frozenData) {
          bufferedWhileFrozen = newState;
          set({
            ...frozenData,
            connected: newState.connected,
            screen: newState.screen,
            activeProfileId: newState.activeProfileId,
          });
        } else {
          set(newState);
        }
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
      clearTimeout(connectTimeout);
      frozenData = null;
      bufferedWhileFrozen = null;
      // Keep the last known screen and data on the display through the outage:
      // blanking the projector on every server blip is worse than briefly
      // stale content, and re-applying the screen after reconnect is exactly
      // where a display can wedge. Only the connected flag drops (it feeds the
      // optional disconnected overlay); the reconnect broadcast then either
      // matches what is already shown (no transition) or moves it forward.
      serverConnected.set(false);
      set({ ...get(state), connected: false });
      if (stopped) return;
      reconnectTimeout = setTimeout(connect, 1000);
    };
  }

  connect();

  // A connection that dies without a close frame (network blip, server machine
  // hard-killed or asleep) never fires onclose, leaving the display frozen on
  // stale state. The server heartbeats state every 2s; if the socket has been
  // silent well past that, force a close so the reconnect loop takes over.
  watchdog = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN && Date.now() - lastMessageAt > 6000) {
      console.log("No heartbeat from server; forcing reconnect");
      socket.close();
    }
  }, 2000);

  // Apply the default theme immediately so the UI isn't unthemed before the
  // first state message arrives.
  applyProfileTheme(null);

  return () => {
    stopped = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (watchdog) clearInterval(watchdog);
    socket?.close();
    socket = null;
  };
});

export function freezeStateData(): void {
  frozenData = get(state);
}

export function unfreezeStateData(): void {
  if (!frozenData) return;
  frozenData = null;
  if (bufferedWhileFrozen) {
    state.set(bufferedWhileFrozen);
    bufferedWhileFrozen = null;
  }
}

// The screen the router last transitioned away from. Lets a screen that mounts
// mid-flow tell a live match flow from a repost/re-show (see ScoresReady).
export const previousScreen = writable<Screen>("none");

// This display's OWN websocket to the display server. Distinct from
// state.connected, which is the SERVER's SignalR link to FMS.
export const serverConnected = writable(false);

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
