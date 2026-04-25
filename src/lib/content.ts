import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";

export type SiteContent = Record<string, any>;

const CONTENT_FILE = path.join(process.cwd(), "src", "data", "content.json");
const KV_KEY = "site_content";

/**
 * PRODUCTION-FIRST Content Fetching
 * Prioritizes Vercel KV for the live site.
 */
export async function getContent(): Promise<SiteContent> {
  // 1. Try Vercel KV (Production)
  if (process.env.KV_REST_API_URL) {
    try {
      const remoteContent = await kv.get<SiteContent>(KV_KEY);
      if (remoteContent) return remoteContent;
    } catch (e) {
      console.error("Error reading Vercel KV:", e);
    }
  }

  // 2. Fallback to Local File (Development)
  try {
    if (!fs.existsSync(CONTENT_FILE)) return {};
    const raw = fs.readFileSync(CONTENT_FILE, "utf-8");
    return JSON.parse(raw) as SiteContent;
  } catch (e) {
    console.error("Error reading local content:", e);
    return {};
  }
}

/**
 * PRODUCTION-FIRST Content Saving
 */
export async function saveContent(content: SiteContent): Promise<void> {
  // 1. Always save to Vercel KV if available
  if (process.env.KV_REST_API_URL) {
    try {
      await kv.set(KV_KEY, content);
    } catch (e) {
      console.error("Error saving to Vercel KV:", e);
    }
  }

  // 2. Also save to local file in development only (Vercel has no writable FS)
  if (process.env.NODE_ENV !== "production") {
    try {
      const raw = JSON.stringify(content, null, 2);
      fs.writeFileSync(CONTENT_FILE, raw, "utf-8");
    } catch (e) {
      console.error("Error saving local content:", e);
      throw e;
    }
  }
}
