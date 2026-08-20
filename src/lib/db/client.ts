import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Lazily creates the DB connection on first use rather than at module load,
 * so importing this file never crashes a route that doesn't actually need
 * the database. Throws only when a caller actually tries to touch the DB
 * without DATABASE_URL configured.
 */
export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision a Postgres database (Vercel Storage → Postgres, or Neon directly) and set DATABASE_URL in your environment."
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
