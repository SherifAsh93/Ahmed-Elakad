/**
 * Returns an optimized image URL routed through Next.js image optimizer.
 * This resizes, converts to WebP/AVIF, and caches the result on disk.
 *
 * Supported sources:
 *  - /media/...  → local images served from public/media
 *  - res.cloudinary.com/... → Cloudinary images (strict transforms prevent direct resize)
 */
export function optimizeImage(url: string | undefined, maxWidth: number = 1200): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  // Skip PNG files — they are typically logos/icons with transparency.
  // /_next/image converts them to AVIF/WebP/JPEG which can lose transparency
  // or alter lossless art. Serve them as-is from the original source.
  const lowerUrl = url.toLowerCase();
  const isPng = lowerUrl.endsWith('.png') || lowerUrl.includes('.png?');

  // Route through /_next/image for known photo origins (skip PNGs)
  if (
    !isPng &&
    (url.startsWith('/media/') || url.includes('res.cloudinary.com'))
  ) {
    return `/_next/image?url=${encodeURIComponent(url)}&w=${maxWidth}&q=75`;
  }

  return url;
}

export function thumbnailImage(url: string | undefined): string {
  return optimizeImage(url, 384);
}
