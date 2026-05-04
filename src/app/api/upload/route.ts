import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
