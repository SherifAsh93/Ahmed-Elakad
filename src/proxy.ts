import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * public/media/ is a legacy, unlinked media dump (old admin uploads,
 * including private client photos) that ships as static files with the
 * deployment — Next/Vercel serve anything under public/ unconditionally,
 * so there's no way to gate it at the file level. No live page references
 * any /media/ URL anymore (everything active was migrated to Cloudinary),
 * so it's safe to require an authenticated admin session here without
 * breaking any public feature.
 */
export function proxy(request: NextRequest) {
  const isAdmin = request.cookies.get("admin_session")?.value === "authenticated";
  if (isAdmin) return NextResponse.next();
  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: ["/media/:path*"],
};
