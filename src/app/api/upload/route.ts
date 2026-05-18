import { NextRequest, NextResponse } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Verify Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary configuration is incomplete." },
        { status: 500 }
      );
    }

    const uploaded: string[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "") // remove extension
        .replace(/[^a-zA-Z0-9\-_]/g, "_");
      
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudinary via stream
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: CLOUDINARY_FOLDER,
            public_id: `${timestamp}-${cleanName}`,
            resource_type: "image",
            overwrite: true,
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("No result"));
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      uploaded.push(result.secure_url);
    }

    return NextResponse.json({ ok: true, uploaded });
  } catch (err) {
    console.error("Cloudinary Upload failure:", err);
    return NextResponse.json(
      { error: `Upload Error: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 500 }
    );
  }
}

// Server-side excluded list so images API hides deleted assets immediately
// (Cloudinary search index lags up to a few minutes after destroy)
export const excludedUrls = new Set<string>();

export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    // Extract public_id: take everything after /upload/, strip optional version (v123/), strip extension
    const uploadIdx = url.indexOf("/upload/");
    if (uploadIdx === -1) return NextResponse.json({ error: "invalid url" }, { status: 400 });

    let publicId = url.slice(uploadIdx + 8);
    publicId = publicId.replace(/^v\d+\//, "");
    publicId = publicId.replace(/\.[^/.]+$/, "");

    console.log("Deleting Cloudinary publicId:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary destroy result:", result);

    if (result.result === "ok" || result.result === "not found") {
      excludedUrls.add(url);
      return NextResponse.json({ ok: true, result: result.result });
    }
    return NextResponse.json({ error: `Cloudinary returned: ${result.result}` }, { status: 500 });
  } catch (err) {
    console.error("Cloudinary Delete failure:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
