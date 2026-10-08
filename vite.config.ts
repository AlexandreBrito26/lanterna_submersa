import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: { globPatterns: ["**/*.{js,css,html,wav,png,svg}"], skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true },
      manifest: {
        name: "Lanterna Submersa",
        short_name: "Lanterna",
        theme_color: "#0B1D2A",
        background_color: "#0B1D2A",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
