import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { scorecardSavePlugin } from "./vite-plugin-scorecard-save";

export default defineConfig({
  plugins: [react(), scorecardSavePlugin()],
  // Same explicit loopback host as bin/scorecard.js, so printed URLs always answer.
  server: { host: "127.0.0.1", port: 5199, strictPort: false },
});
