/**
 * Returns an optimized image URL routed through Next.js image optimizer.
 * This resizes, converts to WebP/AVIF, and caches the result on disk.
 *
 * Supported sources:
 *  - /media/...  → VPS disk images served via Nginx
 *  - res.cloudinary.com/... → Cloudinary images (strict transforms prevent direct resize)
 */
export function optimizeImage(url: string | undefined, maxWidth: number = 1200): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return '';

  // Convert relative /media/ paths to absolute URL (required by Next.js image optimizer)
  let target = url;
  if (url.startsWith('/media/') || url.startsWith('/voices/')) {
    target = `https://ahmedelakad.com${url}`;
  }

  // Skip PNG files — they are typically logos/icons with transparency.
  // /_next/image converts them to AVIF/WebP/JPEG which can lose transparency
  // or alter lossless art. Serve them as-is from the original source.
  const lowerTarget = target.toLowerCase();
  const isPng = lowerTarget.endsWith('.png') || lowerTarget.includes('.png?');

  // Route through /_next/image for known photo origins (skip PNGs)
  if (
    !isPng &&
    (target.startsWith('https://ahmedelakad.com/media/') ||
     target.includes('res.cloudinary.com'))
  ) {
    return `/_next/image?url=${encodeURIComponent(target)}&w=${maxWidth}&q=75`;
  }

  return url;
}

export function thumbnailImage(url: string | undefined): string {
  return optimizeImage(url, 384);
}
