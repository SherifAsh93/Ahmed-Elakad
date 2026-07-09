import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/messages";
import { addAdEnquiry } from "@/lib/adEnquiries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName, phone, email,
      category, eventDate,
      silhouette, designDetails, investmentTier,
    } = body;

    if (!fullName || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const categoryLabel =
      category === "bridal" ? "Bridal Couture" :
      category === "evening" ? "Evening Haute Couture" : category;

    // Save structured record for Analytics dashboard
    addAdEnquiry({
      fullName, phone, email,
      category: category as "bridal" | "evening",
      eventDate, silhouette,
      designDetails: designDetails || "",
      investmentTier,
    });

    // Save to Messages panel for admin visibility
    const messageLines = [
      "🎯 [AD ENQUIRY — Private Atelier Form]",
      "",
      `Collection: ${categoryLabel}`,
      `Event Date: ${eventDate}`,
      `Silhouette: ${silhouette}`,
      `Investment Tier: ${investmentTier}`,
      designDetails ? `\nDesign Vision:\n${designDetails}` : "",
    ].filter(Boolean);

    await addMessage({
      name: fullName,
      phone,
      email,
      message: messageLines.join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
}
