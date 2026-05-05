import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/messages";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const savedMessage = await addMessage({ name, email, phone: phone || "", message });
    return NextResponse.json({ ok: true, message: savedMessage });
  } catch (err: any) {
    console.error("Contact API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
