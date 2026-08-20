import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const IMAGES_DIR = path.join(process.cwd(), "public", "media");
const PUBLIC_BASE = "/media";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

function saveToLocal(buffer: Buffer, ext: string): string {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);
  return `${PUBLIC_BASE}/${filename}`;
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
  if (cleanUrl.startsWith(PUBLIC_BASE)) {
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
    let ext = "jpg";

    if (contentType.startsWith("image/")) {
      imageBuffer = Buffer.from(await response.arrayBuffer());
      if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("gif")) ext = "gif";
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
      const ct = imgRes.headers.get("content-type") || "";
      if (ct.includes("png")) ext = "png";
      else if (ct.includes("webp")) ext = "webp";
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}. Please paste a direct image URL.` },
        { status: 422 }
      );
    }

    const localUrl = saveToLocal(imageBuffer, ext);
    return NextResponse.json({ cloudinaryUrl: localUrl });
  } catch (err) {
    console.error("grab-url error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch image" },
      { status: 500 }
    );
  }
}
