import { defineConfig, type Plugin } from "vite";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";
import rootPkg from "../../package.json";

/**
 * Per-profile victory videos and covers (public/animations/<profile>/) are NOT
 * shipped in the bundle: the server fetches the active profile's set from the
 * asset bucket (tools/publish-assets.ts uploads them). Only the default pack
 * (public/animations/default/) and the stock cover stay in dist.
 */
function dropProfileMedia(): Plugin {
  let outDir = "";
  return {
    name: "drop-profile-media",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const dir = join(outDir, "animations");
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== "default") {
          rmSync(join(dir, entry.name), { recursive: true, force: true });
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Baked so a running display can compare its bundle against the server's
  // reported version and reload itself after the exe auto-updates.
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
  },
  plugins: [svelte({}), dropProfileMedia()],
  resolve: {
    alias: {
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:3001",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
