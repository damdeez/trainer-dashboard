import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load DATABASE_URL (and friends) so the integration test that round-trips
// through a real route handler + Neon can connect. Unit tests don't need it.
config({ path: ".env.local" });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Component + unit tests only; exclude e2e/build artifacts.
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
