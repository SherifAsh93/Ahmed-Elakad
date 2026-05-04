/**
 * Returns the image URL as-is for public pages.
 * Cloudinary account has strict transformations enabled,
 * so unsigned URL transforms return 401.
 * For optimized thumbnails, use the server-signed URLs from /api/images.
 */
export function optimizeImage(url: string | undefined, _maxWidth: number = 1800): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return "";
  return url;
}

export function thumbnailImage(url: string | undefined): string {
  if (!url || typeof url !== "string" || url.trim() === "") return "";
  return url;
}
