import { NextRequest, NextResponse } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_BASES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
]);

function uploadBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${CLOUDINARY_FOLDER}/voices`, resource_type: "video" },
      (err, result) => {
        if (err || !result) return reject(err || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

    const mimeBase = (file.type || "audio/webm").split(";")[0].trim();
    if (!ALLOWED_MIME_BASES.has(mimeBase)) {
      return NextResponse.json({ error: "Unsupported audio format" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadBuffer(buffer);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Voice upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
