import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";
import rootPkg from "../../package.json";

// https://vitejs.dev/config/
export default defineConfig({
  // Baked so a running display can compare its bundle against the server's
  // reported version and reload itself after the exe auto-updates.
  define: {
    __APP_VERSION__: JSON.stringify(rootPkg.version),
  },
  plugins: [svelte({})],
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
