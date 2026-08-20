import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Busboy from "busboy";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export const dynamic = 'force-dynamic';

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

function uploadBuffer(buffer: Buffer, resourceType: "image" | "video"): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: resourceType,
        // Transcode uploaded videos to mp4 for broad browser compatibility
        ...(resourceType === "video" ? { format: "mp4" } : {}),
      },
      (err, result) => {
        if (err || !result) return reject(err || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  return new Promise<NextResponse>((resolve) => {
    const bb = Busboy({ headers: { "content-type": contentType } });
    const tasks: Promise<string>[] = [];

    bb.on("file", (_field, stream, info) => {
      const ext = getExt(info.filename || "upload");
      const isVideo = VIDEO_EXTS.includes(ext) || (!IMAGE_EXTS.includes(ext) && ext !== "");
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));

      const task = new Promise<string>((res, rej) => {
        stream.on("end", async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const url = await uploadBuffer(buffer, isVideo ? "video" : "image");
            res(url);
          } catch (e) {
            rej(e);
          }
        });
        stream.on("error", rej);
      });

      tasks.push(task);
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

    // Historical local media (public/media, shipped with the deployment) —
    // read-only static asset, just hide it from the library listing.
    if (url.startsWith("/media/")) {
      excludedUrls.add(url);
      return NextResponse.json({ ok: true });
    }

    const uploadIdx = url.indexOf("/upload/");
    if (uploadIdx === -1) return NextResponse.json({ error: "invalid url" }, { status: 400 });
    const publicId = url.slice(uploadIdx + 8).replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
    const resourceType = /\.(mp4|webm|mov|avi|mkv|m4v)(\?|$)/i.test(url) ? "video" : "image";
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
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
