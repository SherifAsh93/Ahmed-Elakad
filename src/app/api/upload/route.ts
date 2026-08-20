import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import Busboy from "busboy";

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const IMAGES_DIR = path.join(process.cwd(), "public", "media");
const PUBLIC_BASE = "/media";
const FFMPEG = "/usr/bin/ffmpeg";

// Keep this export so images/route.ts can import it for excluded URL tracking
export const excludedUrls = new Set<string>();

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];
const VIDEO_EXTS = ["mp4", "webm", "mov", "avi", "mkv", "m4v", "3gp", "hevc", "heic", "wmv", "flv"];

function getExt(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase().replace("jpeg", "jpg");
}

// Convert any video to mp4 using ffmpeg, return new path
async function toMp4(inputPath: string): Promise<string> {
  const outputPath = inputPath.replace(/\.[^.]+$/, ".mp4");
  await execFileAsync(FFMPEG, [
    "-i", inputPath,
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    "-y", outputPath,
  ], { timeout: 300000 });
  fs.unlinkSync(inputPath);
  return outputPath;
}

export async function POST(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const contentType = req.headers.get("content-type") || "";

  return new Promise<NextResponse>((resolve) => {
    const bb = Busboy({ headers: { "content-type": contentType } });
    const tasks: Promise<string>[] = [];

    bb.on("file", (_field, stream, info) => {
      const ext = getExt(info.filename || "upload");
      const isVideo = VIDEO_EXTS.includes(ext) || (!IMAGE_EXTS.includes(ext) && ext !== "");
      const saveExt = isVideo ? ext || "mp4" : (IMAGE_EXTS.includes(ext) ? ext : "jpg");
      const basename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const tmpPath = path.join(IMAGES_DIR, `${basename}.${saveExt}`);
      const ws = fs.createWriteStream(tmpPath);

      const task = new Promise<string>((res, rej) => {
        ws.on("finish", async () => {
          try {
            if (isVideo && saveExt !== "mp4" && saveExt !== "webm") {
              // Convert non-mp4/webm video to mp4 for browser compatibility
              const mp4Path = await toMp4(tmpPath);
              const filename = path.basename(mp4Path);
              res(`${PUBLIC_BASE}/${filename}`);
            } else {
              res(`${PUBLIC_BASE}/${basename}.${saveExt}`);
            }
          } catch (e) {
            rej(e);
          }
        });
        ws.on("error", rej);
      });

      tasks.push(task);
      stream.pipe(ws);
    });

    bb.on("finish", async () => {
      try {
        const uploaded = await Promise.all(tasks);
        resolve(NextResponse.json({ ok: true, uploaded }));
      } catch (err) {
        resolve(NextResponse.json({ error: `Upload Error: ${err instanceof Error ? err.message : "Unknown"}` }, { status: 500 }));
      }
    });

    bb.on("error", (err: Error) => {
      resolve(NextResponse.json({ error: `Upload Error: ${err.message}` }, { status: 500 }));
    });

    const reader = req.body?.getReader();
    if (!reader) {
      resolve(NextResponse.json({ error: "No body" }, { status: 400 }));
      return;
    }
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { bb.end(); break; }
        if (!bb.write(value)) await new Promise(r => bb.once("drain", r));
      }
    };
    pump().catch((err: Error) => resolve(NextResponse.json({ error: err.message }, { status: 500 })));
  });
}

export async function DELETE(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    if (url.startsWith(PUBLIC_BASE)) {
      const filename = url.replace(`${PUBLIC_BASE}/`, "");
      const filepath = path.join(IMAGES_DIR, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      excludedUrls.add(url);
      return NextResponse.json({ ok: true });
    }

    const cloudinary = (await import("@/lib/cloudinary")).default;
    const uploadIdx = url.indexOf("/upload/");
    if (uploadIdx === -1) return NextResponse.json({ error: "invalid url" }, { status: 400 });
    let publicId = url.slice(uploadIdx + 8).replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok" || result.result === "not found") {
      excludedUrls.add(url);
      return NextResponse.json({ ok: true, result: result.result });
    }
    return NextResponse.json({ error: `Cloudinary returned: ${result.result}` }, { status: 500 });
  } catch (err) {
    console.error("Delete failure:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
