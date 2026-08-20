import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');
const PUBLIC_BASE = '/media';
const YTDLP = '/home/sherif/yt-dlp';
const COOKIES_FILE = '/home/sherif/data/ahmed-elakad/ig-cookies.txt';
const PLAYWRIGHT_PROFILE = '/home/sherif/.cache/ms-playwright/mcp-chrome-d26cd27/Default';

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

  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  const basename = `ig-${Date.now()}`;
  const outTemplate = path.join(MEDIA_DIR, `${basename}.%(ext)s`);

  // Pick cookie source: prefer explicit cookies file, fall back to Playwright profile
  const cookieArgs: string[] = fs.existsSync(COOKIES_FILE)
    ? ['--cookies', COOKIES_FILE]
    : fs.existsSync(PLAYWRIGHT_PROFILE)
      ? ['--cookies-from-browser', `chromium:${PLAYWRIGHT_PROFILE}`]
      : [];

  if (cookieArgs.length === 0) {
    return NextResponse.json({ error: 'Instagram session not available. Please log in to Instagram in the site browser.' }, { status: 503 });
  }

  try {
    const { stderr } = await execFileAsync(YTDLP, [
      '--no-warnings',
      ...cookieArgs,
      '--merge-output-format', 'mp4',
      '-o', outTemplate,
      url.trim(),
    ], { timeout: 90000 });

    if (stderr) console.error('yt-dlp stderr:', stderr);

    // Find whatever file yt-dlp created with this basename
    const files = fs.readdirSync(MEDIA_DIR).filter(f => f.startsWith(basename));
    if (files.length === 0) {
      return NextResponse.json({ error: 'Download failed — file not created' }, { status: 500 });
    }

    const filename = files[0];
    return NextResponse.json({ url: `${PUBLIC_BASE}/${filename}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('yt-dlp error:', msg);
    return NextResponse.json({ error: `Download failed: ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
