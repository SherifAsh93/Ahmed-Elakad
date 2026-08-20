import cloudinary from "@/lib/cloudinary";

/**
 * Server-only. Returns a signed Cloudinary delivery URL with f_auto,
 * q_auto, and a width cap (serves WebP/AVIF, resized to fit the layout).
 *
 * Must only be called from Server Components or Route Handlers — it uses
 * the Cloudinary Node SDK, which needs the API secret and can't run in
 * the browser. This account has "Strict Transformations" enabled, so an
 * unsigned on-the-fly transform URL 401s; signing is required.
 * (Confirmed: unsigned w_1200,q_75,f_auto → 401. Signed → 200.)
 */
export function signedImageUrl(url: string | undefined, width: number = 800): string {
  if (!url || typeof url !== "string" || url.trim() === "") return "";
  if (!url.includes("res.cloudinary.com")) return url; // local /media/ files etc — leave as-is

  // Skip PNGs — usually logos/art relying on transparency; preserve as-is.
  const lower = url.toLowerCase();
  if (lower.endsWith(".png") || lower.includes(".png?")) return url;

  const match = url.match(/\/upload\/(?:v(\d+)\/)?(.+)$/);
  if (!match) return url;
  const [, version, publicIdWithExt] = match;
  const publicId = decodeURIComponent(publicIdWithExt.replace(/\.[a-zA-Z0-9]+$/, ""));

  return cloudinary.url(publicId, {
    sign_url: true,
    type: "upload",
    version: version ? Number(version) : undefined,
    width,
    crop: "limit",
    fetch_format: "auto",
    quality: "auto",
  });
}

export function signedImageUrls(urls: string[] | undefined, width?: number): string[] {
  return (urls ?? []).map((u) => signedImageUrl(u, width));
}
