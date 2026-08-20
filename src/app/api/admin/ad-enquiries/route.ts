import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdEnquiries, saveAdEnquiries } from "@/lib/adEnquiries";

export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getAdEnquiries());
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (body.resetAll) {
      await saveAdEnquiries([]);
      return NextResponse.json([]);
    }
    if (body.id) {
      const remaining = (await getAdEnquiries()).filter((e) => e.id !== body.id);
      await saveAdEnquiries(remaining);
      return NextResponse.json(remaining);
    }
    return NextResponse.json({ error: "Missing id or resetAll" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
