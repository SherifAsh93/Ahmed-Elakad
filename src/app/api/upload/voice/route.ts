import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VOICES_DIR = "/home/sherif/data/ahmed-elakad/voices";
const PUBLIC_BASE = "https://ahmedelakad.com/voices";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/webm;codecs=opus": "webm",
  "audio/ogg": "ogg",
  "audio/ogg;codecs=opus": "ogg",
  "audio/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/aac": "aac",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

    const mimeBase = (file.type || "audio/webm").split(";")[0].trim();
    const fullMime = file.type || "audio/webm";
    const ext = MIME_TO_EXT[fullMime] ?? MIME_TO_EXT[mimeBase] ?? file.name.split(".").pop()?.toLowerCase() ?? "webm";
    const allowed = ["webm", "mp4", "ogg", "mp3", "wav", "aac"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Unsupported audio format" }, { status: 400 });
    }

    fs.mkdirSync(VOICES_DIR, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(VOICES_DIR, filename), buffer);

    return NextResponse.json({ url: `${PUBLIC_BASE}/${filename}` });
  } catch (err) {
    console.error("Voice upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
