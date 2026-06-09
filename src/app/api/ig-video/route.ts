import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const MEDIA_DIR = '/home/sherif/data/ahmed-elakad/images';
const PUBLIC_BASE = 'https://ahmedelakad.com/media';
const YTDLP = '/home/sherif/yt-dlp';

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

  const filename = `ig-${Date.now()}.mp4`;
  const outPath = path.join(MEDIA_DIR, filename);

  try {
    await execFileAsync(YTDLP, [
      '--no-warnings',
      '-f', 'mp4',
      '-o', outPath,
      url.trim(),
    ], { timeout: 60000 });

    if (!fs.existsSync(outPath)) {
      return NextResponse.json({ error: 'Download failed — file not created' }, { status: 500 });
    }

    return NextResponse.json({ url: `${PUBLIC_BASE}/${filename}` });
  } catch (err) {
    console.error('yt-dlp error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
