import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    solidStart(),
    tailwindcss(),
    nitro({
      // Ensure Nitro serves the SW and workbox files from .output/public
      publicAssets: [
        {
          dir: ".output/public",
          baseURL: "/",
          maxAge: 0,
        },
      ],
      // Ensure static file serving is enabled
      serveStatic: true,
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "memo",
        short_name: "Memo",
        description: "Fast, client-side utility tools — notepad, table editor, image editor",
        theme_color: "#2BA8A2",
        background_color: "#EFF8F7",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "/",
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      // Nitro outputs to .output/public but VitePWA writes to dist/ by default
      // Use closeBundle to copy SW files to Nitro's public directory
      outDir: "dist",
    }),
    {
      name: "copy-sw-to-nitro-public",
      closeBundle() {
        const swSrc = resolve("dist/sw.js");
        const workboxSrc = resolve("dist/workbox-9c191d2f.js");
        const destDir = resolve(".output/public");

        if (existsSync(swSrc)) {
          mkdirSync(destDir, { recursive: true });
          copyFileSync(swSrc, resolve(destDir, "sw.js"));
          console.log("Copied sw.js to .output/public/");
        }
        if (existsSync(workboxSrc)) {
          copyFileSync(workboxSrc, resolve(destDir, "workbox-9c191d2f.js"));
          console.log("Copied workbox-9c191d2f.js to .output/public/");
        }
      },
    },
  ],
});
