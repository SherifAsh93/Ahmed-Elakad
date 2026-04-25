import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Get Cloud Images (Cloudinary folder)
  let cloudFiles: string[] = [];
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET) {
    try {
      let nextCursor: string | undefined;
      do {
        const result = await cloudinary.search
          .expression(`folder:"${CLOUDINARY_FOLDER}/*" OR folder:"${CLOUDINARY_FOLDER}"`)
          .max_results(500)
          .next_cursor(nextCursor || '')
          .execute();
          
        cloudFiles.push(...result.resources.map((r: any) => r.secure_url));
        nextCursor = result.next_cursor;
      } while (nextCursor);
    } catch (e) {
      console.error("Error listing Cloudinary images:", e);
    }
  }

  // 2. Get local legacy images (the ones in your git repo — dev only)
  let legacyFiles: string[] = [];
  if (process.env.NODE_ENV !== "production") {
    const imagesDir = path.join(process.cwd(), "public", "images");
    try {
      if (fs.existsSync(imagesDir)) {
        legacyFiles = fs
          .readdirSync(imagesDir)
          .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
          .map((f) => `/images/${f}`);
      }
    } catch {
      // ignore
    }
  }

  // Combine: Cloud first, then local legacy
  const allImages = Array.from(new Set([...cloudFiles, ...legacyFiles]));

  return NextResponse.json({ images: allImages });
}
