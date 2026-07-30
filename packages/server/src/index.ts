import { AudienceDisplayManager } from "./fms/audience_display";
import { ProfileSelector } from "./profile_selector";
import { checkForUpdate } from "./auto_update";
import { initFmsLogger, setFmsLoggingEnabled } from "./fms_logger";
import { initCaptionControl, setCaptionControlEnabled } from "./caption_control";
import { initLogSync, syncFmsLog } from "./log_sync";
import { existsSync } from "fs";
import { join } from "path";
import zipFile from "../../../ui-dist.zip" with { type: "file" };
import { file } from "bun";
import { unzipSync } from "fflate";

const FMS_URL = process.env.FMS_URL;
const FAKE_FMS = process.env.FAKE_FMS;
const RESOLVED_FMS_URL = FAKE_FMS ? "127.0.0.1:8080" : FMS_URL || "10.0.100.5";

// A failed FMS fetch inside an event handler (e.g. FMS restarting) must not kill the
// display server; log it and keep serving. SignalR reconnects on its own.
process.on("unhandledRejection", (err) => {
  console.log("Unhandled rejection (continuing):", err);
});

// May exit the process to apply a downloaded update (compiled exe only).
await checkForUpdate();

// Must run before the SignalR connections are created so the websocket wrapper
// captures every frame from the first handshake on.
initFmsLogger(RESOLVED_FMS_URL);
initCaptionControl();
initLogSync();

if (process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe")) {
  // Extract the embedded UI in-process (fflate) instead of shelling out to
  // `unzip`, which Windows does not ship.
  const entries = unzipSync(new Uint8Array(await file(zipFile).arrayBuffer()));
  for (const [name, data] of Object.entries(entries)) {
    if (name.endsWith("/")) continue;
    await Bun.write(join("./.temp", name), data);
  }
}

const profileSelector = new ProfileSelector();
console.log(`Active profile: ${profileSelector.get()}`);

const server = Bun.serve({
  fetch(request, server) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const success = server.upgrade(request);
      if (success) return undefined;
      return new Response("Failed to upgrade connection", { status: 400 });
    }

    const rel =
      url.pathname === "/" || url.pathname.startsWith("/display")
        ? "index.html"
        : url.pathname.replace(/^\/+/, "");
    const filePath = join("./.temp/dist", rel);

    if (existsSync(filePath)) {
      return new Response(Bun.file(filePath));
    }
    return new Response("Not found", { status: 404 });
  },
  websocket: {
    async message(ws, message) {
      try {
        const payload = JSON.parse(message.toString());
        if (payload && payload.type === "selectProfile" && typeof payload.id === "string") {
          audienceDisplay.selectProfile(payload.id);
          return;
        }
        if (payload && payload.type === "setFmsLogging" && typeof payload.on === "boolean") {
          setFmsLoggingEnabled(payload.on);
          audienceDisplay.broadcastState();
          return;
        }
        if (payload && payload.type === "setCaptionControl" && typeof payload.on === "boolean") {
          setCaptionControlEnabled(payload.on);
          audienceDisplay.broadcastState();
          return;
        }
      } catch {
        // not JSON or malformed; ignore
      }
      console.log(`Received message: ${message}`);
    },
    open(ws) {
      console.log("Client connected!");
      ws.subscribe("audience-display");
      audienceDisplay.broadcastState();
    },
    close(ws) {
      console.log("Client disconnected!");
      ws.unsubscribe("audience-display");
    },
  },
  port: 3001,
});

console.log("Fake FMS:", FAKE_FMS);

const audienceDisplay = new AudienceDisplayManager(
  server,
  RESOLVED_FMS_URL,
  profileSelector
);

// State heartbeat: FMS events can go quiet for minutes between matches, and
// displays use this cadence to detect half-dead sockets (their watchdog forces
// a reconnect after ~6s of silence).
setInterval(() => audienceDisplay.broadcastState(), 2000);

console.log(`Listening on ${server.hostname}:${server.port}`);

// End-of-event guarantee: push any unsynced log rows before the process dies
// (Ctrl+C, service stop, auto-update relaunch). The periodic timer alone would
// lose everything logged since the last tick.
let shuttingDown = false;
async function finalSyncAndExit(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal}: running final log sync before exit`);
  try {
    await syncFmsLog("shutdown");
  } catch {}
  process.exit(0);
}
process.on("SIGINT", () => void finalSyncAndExit("SIGINT"));
process.on("SIGTERM", () => void finalSyncAndExit("SIGTERM"));
