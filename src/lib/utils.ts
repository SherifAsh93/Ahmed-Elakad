/**
 * Returns a display URL for an image, resized and format-negotiated
 * (WebP/AVIF via f_auto) at the given width.
 *
 * This is called from both Server and Client Components, so it can't call
 * the Cloudinary Node SDK directly (needs the server-only API secret —
 * this account has "Strict Transformations" enabled, so an unsigned
 * resize URL 401s). It also must never receive URLs that get saved back
 * to the database unchanged (e.g. via CollectionGrid's reorder/cover
 * actions) — so callers should keep raw URLs in their own state and only
 * pass through this function at render time.
 *
 * Routes through our own /api/cloudinary-image proxy, which signs and
 * streams the transform server-side — NOT Next's /_next/image optimizer,
 * whose Vercel Image Optimization quota this account has exhausted (see
 * git history: X-Vercel-Error: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
 */
export function optimizeImage(url: string | undefined, maxWidth: number = 800): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  // Skip PNGs — usually logos/art relying on transparency; serve as-is.
  const lowerUrl = url.toLowerCase();
  const isPng = lowerUrl.endsWith('.png') || lowerUrl.includes('.png?');
  if (isPng) return url;

  if (url.includes('res.cloudinary.com')) {
    return `/api/cloudinary-image?url=${encodeURIComponent(url)}&w=${maxWidth}`;
  }

  return url; // local /media/... etc — already reasonably sized, served as-is
}

export function thumbnailImage(url: string | undefined): string {
  return optimizeImage(url, 400);
}
