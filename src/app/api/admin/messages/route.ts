import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/messages";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await getMessages();
    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
