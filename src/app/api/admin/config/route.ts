import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminPassword, setAdminPassword } from "@/lib/config";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function PUT(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const current = getAdminPassword();
  if (currentPassword !== current) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  setAdminPassword(newPassword);
  return NextResponse.json({ ok: true });
}
