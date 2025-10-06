import { AudienceDisplayManager } from "./fms/audience_display";
import { existsSync } from "fs";
import { join } from "path";
import zipFile from "../../../ui-dist.zip" with { type: "file" };
import { $, file } from "bun";

// Get FMS url from environment
const FMS_URL = process.env.FMS_URL;
const FAKE_FMS = process.env.FAKE_FMS;

if (process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe")) {
  await Bun.write("./.temp/public.zip", file(zipFile));
  await $`unzip -o ./.temp/public.zip -d ./.temp`;
}

const server = Bun.serve({
  fetch(request, server) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const success = server.upgrade(request);
      if (success) {
        return undefined;
      } else {
        return new Response("Failed to upgrade connection", {
          status: 400,
        });
      }
    }

    const rel = url.pathname === "/" || url.pathname.startsWith("/display") ? "index.html" : url.pathname.replace(/^\/+/, "");
    const filePath = join("./.temp/dist", rel);

    if (existsSync(filePath)) {
      return new Response(Bun.file(filePath));
    }
    return new Response("Not found", { status: 404 });
  },
  websocket: {
    async message(ws, message) {
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
  port: 3001
});

console.log("Fake FMS:", FAKE_FMS);

const audienceDisplay = new AudienceDisplayManager(
  server,
  FAKE_FMS ? "127.0.0.1:8080" : FMS_URL || "10.0.100.5",
);

console.log(`Listening on ${server.hostname}:${server.port}`);
