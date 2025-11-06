// vite.config.js - Driver App Configuration (Production Mode)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Proxy for tracking API (main tptraveltransfer.com server)
      "/api/tracking": {
        target: "https://www.tptraveltransfer.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Keep the path as-is, since tracking API is at /api/tracking on the server
          return path;
        },
      },
      // Proxy for driver API (driver.tptraveltransfer.com server)
      "/api": {
        target: "https://driver.tptraveltransfer.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Keep the path as-is
          return path;
        },
      },
    },
  },
});
