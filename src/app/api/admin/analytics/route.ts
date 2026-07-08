import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import {
  getAnalytics,
  upsertMonth,
  deleteMonth,
  type MonthlyAnalytics,
  type InstagramPost,
  type AuditResult,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(getAnalytics());
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Save / update a month's post data
export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const month: MonthlyAnalytics = body.month;
    if (!month?.id) return NextResponse.json({ error: "Missing month data" }, { status: 400 });
    const all = upsertMonth(month);
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Run AI audit for a specific month
export async function PUT(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { monthId } = await req.json();
    if (!monthId) return NextResponse.json({ error: "Missing monthId" }, { status: 400 });

    const all = getAnalytics();
    const month = all.find((m) => m.id === monthId);
    if (!month) return NextResponse.json({ error: "Month not found" }, { status: 404 });
    if (!month.posts.length) return NextResponse.json({ error: "No posts to analyze" }, { status: 400 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const postsTable = month.posts.map((p: InstagramPost) =>
      `- Date: ${p.date} | Format: ${p.format} | Topic: "${p.topic}" | Reach: ${p.reach} | Impressions: ${p.impressions} | Likes: ${p.likes} | Comments: ${p.comments} | Shares: ${p.shares} | Saves: ${p.saves} | Time: ${p.postTime} | CTA: "${p.cta}"`
    ).join("\n");

    const prompt = `You are an Instagram analytics expert. Analyze this Instagram account's monthly performance data and return a JSON object with specific, data-driven insights.

Month: ${month.monthLabel}
Number of posts: ${month.posts.length}

Posts Data:
${postsTable}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "summary": "2-3 sentence overall performance assessment mentioning specific numbers",
  "keyInsight": "The single most impactful finding with specific numbers, e.g. 'Posts about X topics generate 27x higher reach than average'",
  "topPerformers": [
    { "topic": "topic name", "avgReach": 12345, "insight": "why it performs well" }
  ],
  "formatBreakdown": [
    { "format": "Reel", "count": 5, "avgReach": 8000, "pctContent": "39%", "pctReach": "45%" }
  ],
  "bestPostTimes": [
    { "time": "8:00 PM", "avgReach": 9500, "count": 3, "insight": "peak engagement time" }
  ],
  "ctaAnalysis": [
    { "cta": "CTA text", "avgEngagement": 450, "insight": "effect on engagement" }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3",
    "Specific actionable recommendation 4",
    "Specific actionable recommendation 5"
  ],
  "bioSuggestions": "Specific suggestions for the bio based on content themes and top-performing topics"
}

Focus on specific numbers and patterns. Group similar topics together. Calculate accurate averages from the data provided.`;

    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    const auditData = JSON.parse(jsonMatch[0]);
    const audit: AuditResult = { ...auditData, createdAt: new Date().toISOString() };

    const updatedMonth = { ...month, audit };
    const updated = upsertMonth(updatedMonth);
    return NextResponse.json({ all: updated, audit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Delete a month
export async function DELETE(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { monthId } = await req.json();
    if (!monthId) return NextResponse.json({ error: "Missing monthId" }, { status: 400 });
    const all = deleteMonth(monthId);
    return NextResponse.json(all);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
