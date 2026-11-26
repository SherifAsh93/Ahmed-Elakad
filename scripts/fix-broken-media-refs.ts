/**
 * Repoints legacy `https://ahmedelakad.com/media/<filename>` references
 * (broken in production — proxy.ts blocks that domain) to their restored
 * Cloudinary counterparts, using the filename -> secure_url mapping
 * produced by scripts/restore-backup-media.ts.
 *
 * Patches the live DB (source of truth for the running site: site_content
 * + clients tables) in place — only touching matched string values, never
 * overwriting unrelated fields — plus the local data/*.json files for
 * repo/version-history consistency (those files are not read at runtime).
 *
 * Usage: npx tsx scripts/fix-broken-media-refs.ts
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

import { getDb } from "../src/lib/db/client";
import { siteContent, clients } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const RESULTS_PATH = path.join(process.cwd(), "scripts", ".restore-media-results.jsonl");
const LEGACY_PREFIX = "https://ahmedelakad.com/media/";

function loadMapping(): Map<string, string> {
  const map = new Map<string, string>();
  const lines = fs.readFileSync(RESULTS_PATH, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    const r = JSON.parse(line);
    if (r.ok && r.url) map.set(r.filename, r.url);
  }
  return map;
}

/** Recursively walks a JSON value, replacing matched legacy URLs. Returns [newValue, changedCount]. */
function repoint(value: unknown, mapping: Map<string, string>): [unknown, number] {
  if (typeof value === "string") {
    if (value.startsWith(LEGACY_PREFIX)) {
      const filename = value.slice(LEGACY_PREFIX.length);
      const replacement = mapping.get(filename);
      if (replacement) return [replacement, 1];
    }
    return [value, 0];
  }
  if (Array.isArray(value)) {
    let total = 0;
    const next = value.map((v) => {
      const [nv, c] = repoint(v, mapping);
      total += c;
      return nv;
    });
    return [next, total];
  }
  if (value && typeof value === "object") {
    let total = 0;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const [nv, c] = repoint(v, mapping);
      next[k] = nv;
      total += c;
    }
    return [next, total];
  }
  return [value, 0];
}

function findRemaining(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    if (value.startsWith(LEGACY_PREFIX)) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) findRemaining(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) findRemaining(v, out);
  }
}

async function main() {
  const mapping = loadMapping();
  console.log(`Loaded ${mapping.size} restored filename -> Cloudinary URL mappings.`);

  const db = getDb();

  // --- site_content (DB, source of truth for the live site) ---
  const contentRows = await db.select().from(siteContent);
  let contentChanged = 0;
  for (const row of contentRows) {
    const [next, count] = repoint(row.data, mapping);
    if (count > 0) {
      await db.update(siteContent).set({ data: next as never, updatedAt: new Date() }).where(eq(siteContent.id, row.id));
      contentChanged += count;
      console.log(`site_content[${row.id}]: repointed ${count} reference(s)`);
    }
  }

  // --- clients (DB, source of truth for the live site) ---
  const clientRows = await db.select().from(clients);
  let clientsChanged = 0;
  const stillBroken = new Set<string>();
  for (const row of clientRows) {
    const [next, count] = repoint(row.data, mapping);
    if (count > 0) {
      await db.update(clients).set({ data: next as never }).where(eq(clients.id, row.id));
      clientsChanged += count;
    }
    findRemaining(count > 0 ? next : row.data, stillBroken);
  }

  console.log(`\nDB: repointed ${contentChanged} refs in site_content, ${clientsChanged} refs in clients.`);
  console.log(`DB: ${stillBroken.size} legacy references remain unresolved (no matching backup file):`);
  for (const u of stillBroken) console.log(`  - ${u}`);

  // --- local data/*.json (not read at runtime, kept for repo history) ---
  for (const file of ["data/content.json", "data/clients.json"]) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;
    const json = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const [next, count] = repoint(json, mapping);
    if (count > 0) {
      fs.writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n");
      console.log(`${file}: repointed ${count} reference(s)`);
    } else {
      console.log(`${file}: no changes needed`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
