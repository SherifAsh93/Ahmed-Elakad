import { NextResponse } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// In-memory cache for fast repeat loads
let cachedResult: { images: string[]; thumbnails: Record<string, string> } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

export async function GET() {
  const now = Date.now();
  if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedResult, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  const images: string[] = [];
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
          const url: string = r.secure_url;
          if (!url || url.trim() === "" || url.endsWith(".json")) continue;
          images.push(url);

          // Generate a signed thumbnail URL so strict-transform accounts work
          try {
            const thumb = cloudinary.url(r.public_id, {
              sign_url: true,
              type: "upload",
              width: 400,
              height: 500,
              crop: "fill",
              gravity: "auto",
              fetch_format: "auto",
              quality: "auto",
            });
            thumbnails[url] = thumb;
          } catch {
            thumbnails[url] = url; // fallback to original
          }
        }

        nextCursor = result.next_cursor;
      } while (nextCursor);
    } catch (e) {
      console.error("Cloudinary Search error:", e);
    }
  }

  const dedupedImages = Array.from(new Set(images));
  const payload = { images: dedupedImages, thumbnails };

  cachedResult = payload;
  cacheTimestamp = now;

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
