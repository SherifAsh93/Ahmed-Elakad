import fs from "fs";
import path from "path";
import { put, list, del } from "@vercel/blob";

export type SiteContent = Record<string, any>;

const CONTENT_FILE = path.join(process.cwd(), "src", "data", "content.json");
const BLOB_FILENAME = "content.json";

async function getBlobUrl(): Promise<string | null> {
  try {
    const { blobs } = await list();
    const found = blobs.find((b) => b.pathname === BLOB_FILENAME);
    return found?.url ?? null;
  } catch {
    return null;
  }
}

export async function getContent(): Promise<SiteContent> {
  // 1. Try Vercel Blob (Production)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const url = await getBlobUrl();
      if (url) {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) return await res.json();
      }
    } catch (e) {
      console.error("Error reading Vercel Blob:", e);
    }
  }

  // 2. Fallback to local file (Development)
  try {
    if (!fs.existsSync(CONTENT_FILE)) return {};
    const raw = fs.readFileSync(CONTENT_FILE, "utf-8");
    return JSON.parse(raw) as SiteContent;
  } catch (e) {
    console.error("Error reading local content:", e);
    return {};
  }
}

export async function saveContent(content: SiteContent): Promise<void> {
  // 1. Save to Vercel Blob if available
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Delete old blob first to avoid duplicates
      const url = await getBlobUrl();
      if (url) await del(url);

      // Upload new content
      await put(BLOB_FILENAME, JSON.stringify(content, null, 2), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
    } catch (e) {
      console.error("Error saving to Vercel Blob:", e);
      throw e;
    }
  }

  // 2. Also save locally in development
  if (process.env.NODE_ENV !== "production") {
    try {
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving local content:", e);
    }
  }
}
