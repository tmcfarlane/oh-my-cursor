import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy API calls to the local engine bridge (node bridge/server.mjs).
    proxy: { "/api": "http://127.0.0.1:8787" },
  },
});
