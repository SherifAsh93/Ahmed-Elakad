import { NextResponse } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";
import { excludedUrls } from "@/app/api/upload/route";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const IMAGES_DIR = path.join(process.cwd(), "public", "media");
const PUBLIC_BASE = "/media";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// Cache
let cachedResult: { images: string[]; thumbnails: Record<string, string> } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

function getLocalImages(): string[] {
  try {
    if (!fs.existsSync(IMAGES_DIR)) return [];
    return fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => {
        // Sort newest first by timestamp prefix in filename
        const ta = parseInt(a.split("-")[0]) || 0;
        const tb = parseInt(b.split("-")[0]) || 0;
        return tb - ta;
      })
      .map((f) => `${PUBLIC_BASE}/${f}`);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bust = url.searchParams.get("nocache");
  if (bust) { cachedResult = null; cacheTimestamp = 0; }

  const now = Date.now();
  if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedResult, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // Local images (new storage) — newest first
  const localImages = getLocalImages();

  // Legacy Cloudinary images — still show them so existing designs keep working
  const cloudinaryImages: string[] = [];
  const thumbnails: Record<string, string> = {};

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET) {
    try {
      let nextCursor: string | undefined;
      do {
        const result = await cloudinary.search
          .expression(`resource_type:image AND (folder:"${CLOUDINARY_FOLDER}/*" OR folder:"${CLOUDINARY_FOLDER}")`)
          .sort_by("created_at", "desc")
          .max_results(500)
          .next_cursor(nextCursor || "")
          .execute();

        for (const r of result.resources) {
          const imgUrl: string = r.secure_url;
          if (!imgUrl || imgUrl.endsWith(".json")) continue;
          cloudinaryImages.push(imgUrl);
          try {
            thumbnails[imgUrl] = cloudinary.url(r.public_id, {
              sign_url: true, type: "upload",
              width: 400, height: 500, crop: "fill", gravity: "auto",
              fetch_format: "auto", quality: "auto",
            });
          } catch {
            thumbnails[imgUrl] = imgUrl;
          }
        }
        nextCursor = result.next_cursor;
      } while (nextCursor);
    } catch (e) {
      console.error("Cloudinary Search error:", e);
    }
  }

  // Local images go first (newest), then Cloudinary (existing library)
  const allImages = [...localImages, ...cloudinaryImages]
    .filter((u) => !excludedUrls.has(u));

  const deduped = Array.from(new Set(allImages));
  const payload = { images: deduped, thumbnails };

  cachedResult = payload;
  cacheTimestamp = now;

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
