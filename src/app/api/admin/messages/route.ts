import { NextRequest, NextResponse } from "next/server";
import { getMessages, deleteMessage, markMessageRead } from "@/lib/messages";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteMessage(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, read } = await req.json();
    if (!id || read === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    await markMessageRead(id, read);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
