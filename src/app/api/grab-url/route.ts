import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

function saveToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: CLOUDINARY_FOLDER, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.instagram.com/",
};

export async function POST(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

  const cleanUrl = url.trim();

  // Already our own local media URL — use directly
  if (cleanUrl.startsWith("/media/")) {
    return NextResponse.json({ cloudinaryUrl: cleanUrl, alreadySynced: true });
  }

  // Already a Cloudinary URL from old uploads — use directly
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (cloudName && cleanUrl.includes(`res.cloudinary.com/${cloudName}/`)) {
    return NextResponse.json({ cloudinaryUrl: cleanUrl, alreadySynced: true });
  }

  try {
    const response = await fetch(cleanUrl, { headers: FETCH_HEADERS, redirect: "follow" });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch URL (HTTP ${response.status}). Try right-clicking the image and choosing "Copy Image Address".` },
        { status: 422 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    let imageBuffer: Buffer | null = null;

    if (contentType.startsWith("image/")) {
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else if (contentType.includes("text/html")) {
      const html = await response.text();
      // Extract og:image from the page (works for Instagram, Facebook, most social posts)
      const ogMatch =
        html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

      if (!ogMatch?.[1]) {
        return NextResponse.json(
          { error: "No image found on this page. Right-click the image and choose 'Copy Image Address', then paste that URL here." },
          { status: 422 }
        );
      }

      // Decode HTML entities (&amp; → &) in the extracted URL
      const ogImageUrl = ogMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

      const imgRes = await fetch(ogImageUrl, { headers: FETCH_HEADERS, redirect: "follow" });
      if (!imgRes.ok) {
        return NextResponse.json({ error: "Found image on page but could not download it." }, { status: 422 });
      }
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}. Please paste a direct image URL.` },
        { status: 422 }
      );
    }

    const savedUrl = await saveToCloudinary(imageBuffer);
    return NextResponse.json({ cloudinaryUrl: savedUrl });
  } catch (err) {
    console.error("grab-url error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch image" },
      { status: 500 }
    );
  }
}
