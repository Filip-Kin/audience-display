import { AudienceDisplayManager } from "./fms/audience_display";
import { ProfileSelector } from "./profile_selector";
import { checkForUpdate } from "./auto_update";
import { initFmsLogger } from "./fms_logger";
import { initLogSync } from "./log_sync";
import { existsSync } from "fs";
import { join } from "path";
import zipFile from "../../../ui-dist.zip" with { type: "file" };
import { $, file } from "bun";

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
initLogSync();

if (process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe")) {
  await Bun.write("./.temp/public.zip", file(zipFile));
  await $`unzip -o ./.temp/public.zip -d ./.temp`;
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

console.log(`Listening on ${server.hostname}:${server.port}`);
