/**
 * One-time migration: loads the existing data/content.json and
 * data/clients.json files into Postgres. Run once after DATABASE_URL is
 * set and `npx drizzle-kit migrate` (or push) has created the tables.
 *
 * Usage: npx tsx scripts/seed-db.ts
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env.local") });

import { getDb } from "../src/lib/db/client";
import { siteContent, clients } from "../src/lib/db/schema";

async function main() {
  const db = getDb();

  const contentPath = path.join(process.cwd(), "data", "content.json");
  if (fs.existsSync(contentPath)) {
    const content = JSON.parse(fs.readFileSync(contentPath, "utf-8"));
    await db
      .insert(siteContent)
      .values({ id: "site", data: content })
      .onConflictDoUpdate({ target: siteContent.id, set: { data: content, updatedAt: new Date() } });
    console.log("Seeded site_content from data/content.json");
  } else {
    console.log("No data/content.json found — skipping");
  }

  const clientsPath = path.join(process.cwd(), "data", "clients.json");
  if (fs.existsSync(clientsPath)) {
    const clientList = JSON.parse(fs.readFileSync(clientsPath, "utf-8")) as { id: string }[];
    for (const c of clientList) {
      await db
        .insert(clients)
        .values({ id: c.id, data: c })
        .onConflictDoUpdate({ target: clients.id, set: { data: c, updatedAt: new Date() } });
    }
    console.log(`Seeded ${clientList.length} clients from data/clients.json`);
  } else {
    console.log("No data/clients.json found — skipping");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
