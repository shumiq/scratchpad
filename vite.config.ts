import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    solidStart(),
    tailwindcss(),
    nitro(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Scratch Pad",
        short_name: "ScratchPad",
        description: "Fast, client-side utility tools — notepad, table editor, image editor",
        theme_color: "#2BA8A2",
        background_color: "#EFF8F7",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "48x48",
            type: "image/x-icon",
          },
        ],
      },
    }),
  ],
});
