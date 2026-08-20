import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function auth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

  if (!/instagram\.com\/(?:p|reel|tv)\//.test(url)) {
    return NextResponse.json({ error: 'Not an Instagram URL' }, { status: 400 });
  }

  // This feature relied on a yt-dlp binary, a persistent Instagram cookie
  // jar, and a Playwright browser profile living on the old VPS — none of
  // which exist in this serverless hosting environment (no writable disk,
  // no long-lived processes, no local binaries). It cannot work here.
  return NextResponse.json(
    { error: 'Instagram video import isn’t available on this hosting environment. Please download the video manually and upload it via the regular Upload button instead.' },
    { status: 501 }
  );
}
