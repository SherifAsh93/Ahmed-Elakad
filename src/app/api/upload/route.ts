import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

const IMAGES_DIR = "/home/sherif/data/ahmed-elakad/images";
const PUBLIC_BASE = "https://ahmedelakad.com/media";

// Keep this export so images/route.ts can import it for excluded URL tracking
export const excludedUrls = new Set<string>();

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

function saveToLocal(buffer: Buffer, originalName: string): string {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const ext = (originalName.split(".").pop()?.toLowerCase() || "jpg")
    .replace("jpeg", "jpg");
  const allowed = ["jpg", "png", "webp", "gif"];
  const finalExt = allowed.includes(ext) ? ext : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${finalExt}`;
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);
  return `${PUBLIC_BASE}/${filename}`;
}

export async function POST(req: NextRequest) {
  if (!(await auth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploaded: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = saveToLocal(buffer, file.name);
      uploaded.push(url);
    }

    return NextResponse.json({ ok: true, uploaded });
  } catch (err) {
    console.error("Upload failure:", err);
    return NextResponse.json(
      { error: `Upload Error: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 500 }
    );
  }
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
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      excludedUrls.add(url);
      return NextResponse.json({ ok: true });
    }

    // Legacy Cloudinary delete
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
