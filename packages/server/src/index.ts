import { AudienceDisplayManager } from "./fms/audience_display";
import { EventConfigManager } from "./config/event_config_manager";
import { resolveConfigsDir } from "./config/paths";
import { existsSync } from "fs";
import { join, resolve } from "path";
import zipFile from "../../../ui-dist.zip" with { type: "file" };
import { $, file } from "bun";

const FMS_URL = process.env.FMS_URL;
const FAKE_FMS = process.env.FAKE_FMS;

if (process.execPath.endsWith(".exe") && !process.execPath.endsWith("bun.exe")) {
  await Bun.write("./.temp/public.zip", file(zipFile));
  await $`unzip -o ./.temp/public.zip -d ./.temp`;
}

const configsDir = resolveConfigsDir();
const configManager = new EventConfigManager(configsDir);
console.log(`Event configs directory: ${configsDir}`);
console.log(`Available configs: ${configManager.list().join(", ")}`);

const configsDirAbs = resolve(configsDir);

function serveConfigAsset(pathname: string): Response | null {
  const rel = decodeURIComponent(pathname.replace(/^\/configs\/+/, ""));
  if (!rel) return new Response("Not found", { status: 404 });
  const absolute = resolve(join(configsDirAbs, rel));
  // Path-traversal guard: resolved path must stay inside configsDir.
  if (!absolute.startsWith(configsDirAbs)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!existsSync(absolute)) return new Response("Not found", { status: 404 });
  return new Response(Bun.file(absolute));
}

const server = Bun.serve({
  fetch(request, server) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const success = server.upgrade(request);
      if (success) return undefined;
      return new Response("Failed to upgrade connection", { status: 400 });
    }

    if (url.pathname.startsWith("/configs/")) {
      const res = serveConfigAsset(url.pathname);
      if (res) return res;
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
        if (payload && payload.type === "selectConfig" && typeof payload.name === "string") {
          audienceDisplay.selectConfig(payload.name);
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
  FAKE_FMS ? "127.0.0.1:8080" : FMS_URL || "10.0.100.5",
  configManager
);

console.log(`Listening on ${server.hostname}:${server.port}`);
