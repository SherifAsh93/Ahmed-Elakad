import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.instagram.com/',
};

const cache = new Map<string, { videoUrl: string; expires: number }>();

export async function GET(req: NextRequest) {
  const igUrl = req.nextUrl.searchParams.get('url');
  if (!igUrl) return new NextResponse('Missing url', { status: 400 });

  const cached = cache.get(igUrl);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.redirect(cached.videoUrl);
  }

  try {
    const res = await fetch(igUrl, { headers: HEADERS, redirect: 'follow' });
    if (!res.ok) return new NextResponse(`Instagram fetch failed: ${res.status}`, { status: 502 });

    const html = await res.text();

    const match =
      html.match(/property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:video:secure_url["']/i) ||
      html.match(/property=["']og:video["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]+property=["']og:video["']/i);

    if (!match?.[1]) {
      return new NextResponse('Video URL not found in page', { status: 422 });
    }

    const videoUrl = match[1].replace(/&amp;/g, '&');
    cache.set(igUrl, { videoUrl, expires: Date.now() + 20 * 60 * 1000 });

    return NextResponse.redirect(videoUrl);
  } catch (err) {
    console.error('ig-video error:', err);
    return new NextResponse('Error resolving video', { status: 500 });
  }
}
