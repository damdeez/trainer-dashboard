import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local for drizzle-kit CLI commands (push, studio, generate).
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // strict prompts for confirmation on every push (even non-destructive),
  // which deadlocks non-interactive runs. Push still refuses data-loss
  // statements unless `--force` is passed.
  strict: false,
  verbose: true,
});
