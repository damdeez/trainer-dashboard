import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
  );
}

// Neon's HTTP driver: one round-trip per query, no connection pool to manage —
// ideal for serverless (Vercel) where long-lived TCP pools are a liability.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export type DB = typeof db;
