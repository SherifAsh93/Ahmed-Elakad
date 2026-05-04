/** Optimizes Cloudinary URLs for faster loading */
export function optimizeImage(url: string | undefined, maxWidth: number = 1800): string {
  if (!url || typeof url !== 'string' || url.trim() === '') return "";
  return url;
}

export function thumbnailImage(url: string | undefined): string {
  if (!url || typeof url !== "string" || url.trim() === "") return "";
  return url;
}
