import { NextRequest, NextResponse } from "next/server";
import { signedImageUrl } from "@/lib/cloudinaryImage";

/**
 * Streams a resized/format-negotiated Cloudinary image through our own
 * serverless function instead of Vercel's Image Optimization API (which
 * this account's quota can no longer cover — see git history). Cloudinary
 * does the actual resizing/format conversion on its own CDN for free;
 * this route only computes the signature (this account requires signed
 * transform URLs) and proxies the bytes so callers can keep using a
 * plain same-origin <img src>.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const width = Number(req.nextUrl.searchParams.get("w")) || 800;
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const signed = signedImageUrl(url, width);
  if (!signed) return NextResponse.json({ error: "Invalid url" }, { status: 400 });

  // Forward the browser's Accept header so Cloudinary's f_auto negotiates
  // the real format (AVIF/WebP/etc) for the actual requesting browser.
  // cache: "no-store" — otherwise Next's fetch() memoizes by URL alone and
  // a later request with a different Accept header gets an earlier
  // request's cached (wrong-format) response.
  const upstream = await fetch(signed, {
    headers: { Accept: req.headers.get("accept") ?? "image/avif,image/webp,image/*,*/*" },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // Vary: Accept — our own response caching (CDN/browser) must also key
      // on Accept, or the same problem happens one layer up: a WebP-capable
      // visitor could get served a JPEG response cached from a request that
      // didn't ask for WebP.
      "Cache-Control": "public, max-age=2592000, immutable",
      "Vary": "Accept",
    },
  });
}
