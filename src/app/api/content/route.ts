import { NextRequest, NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content);
}

export async function POST(req: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await saveContent(body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
