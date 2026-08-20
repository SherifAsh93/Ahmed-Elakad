/* eslint-disable @typescript-eslint/no-explicit-any -- generic dispatch across heterogeneous Drizzle table shapes; Drizzle's pg-core generics can't express "any JSONB-row table" cleanly */
import { eq } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { getDb } from "./client";

type JsonRowTable = PgTable & {
  id: { name: string };
  data: { name: string };
};

/**
 * Generic helpers matching the old fs-based "read whole file / write whole
 * file" shape from lib/content.ts, lib/clients.ts, etc. Each JSON array
 * item becomes one row (keyed by its own `id`), each singleton JSON object
 * becomes a single row under a fixed id. This keeps the migration off
 * lib/*.ts mechanical: swap the storage primitive, keep the business logic.
 */

export async function getSingleton<T>(table: JsonRowTable, id: string): Promise<T | null> {
  const db = getDb();
  const rows = await db.select().from(table as any).where(eq((table as any).id, id)).limit(1);
  return (rows[0] as any)?.data ?? null;
}

export async function saveSingleton<T>(table: JsonRowTable, id: string, data: T): Promise<void> {
  const db = getDb();
  await db
    .insert(table as any)
    .values({ id, data, updatedAt: new Date() } as any)
    .onConflictDoUpdate({
      target: (table as any).id,
      set: { data, updatedAt: new Date() } as any,
    });
}

export async function getCollection<T>(table: JsonRowTable): Promise<T[]> {
  const db = getDb();
  const rows = await db.select().from(table as any);
  return rows.map((r: any) => r.data as T);
}

/**
 * Replaces the entire collection to match the old "overwrite whole array"
 * semantics of atomicWriteJSON. Not wrapped in a single DB transaction
 * (Neon's HTTP driver doesn't support interactive transactions) — for this
 * app's admin-only write volume the brief non-atomic window between the
 * delete and the inserts is an acceptable tradeoff versus the complexity of
 * a websocket-based transactional driver. If that ever changes, switch to
 * drizzle-orm/neon-serverless with a Pool.
 */
export async function saveCollection<T extends { id: string }>(table: JsonRowTable, rows: T[]): Promise<void> {
  const db = getDb();
  await db.delete(table as any);
  if (rows.length === 0) return;
  await db.insert(table as any).values(rows.map((r) => ({ id: r.id, data: r })) as any);
}
