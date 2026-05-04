import { NextResponse } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET() {
  const cloudFiles: string[] = [];
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET) {
    try {
      let nextCursor: string | undefined;
      // Use the reliable SEARCH API, but sort by newest and keep the empty filter
      do {
        const result = await cloudinary.search
          .expression(`resource_type:image AND (folder:"${CLOUDINARY_FOLDER}/*" OR folder:"${CLOUDINARY_FOLDER}")`)
          .sort_by('created_at', 'desc')
          .max_results(500)
          .next_cursor(nextCursor || '')
          .execute();
          
        const validUrls = result.resources
          .map((r: any) => r.secure_url)
          .filter((url: string) => url && url.trim() !== "" && !url.endsWith('.json'));
          
        cloudFiles.push(...validUrls);
        nextCursor = result.next_cursor;
      } while (nextCursor);
    } catch (e) {
      console.error("Cloudinary Search error:", e);
    }
  }

  const allImages = Array.from(new Set(cloudFiles));
  return NextResponse.json({ images: allImages });
}
