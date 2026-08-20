/**
 * Returns a display URL for an image.
 *
 * Previously routed Cloudinary/local images through Next's /_next/image
 * optimizer. That now fails account-wide with 402 Payment Required
 * (X-Vercel-Error: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) once the
 * account's Vercel Image Optimization quota is exhausted — every image
 * not already cached from a prior request breaks. Cloudinary already
 * hosts and can resize these images on its own CDN for free, but this
 * account has "Strict Transformations" enabled, so an unsigned resize
 * URL 401s; a signed one requires the Cloudinary Node SDK (server-only,
 * needs the API secret) and this function is also called from client
 * components. Serving the original URL unchanged is always safe (verified
 * every current image URL resolves with a plain 200) — it just skips
 * resizing/format conversion, so images are somewhat larger than optimal.
 * See scripts/ history for the investigation.
 */
export function optimizeImage(url: string | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';
  return url;
}

export function thumbnailImage(url: string | undefined): string {
  return optimizeImage(url);
}
