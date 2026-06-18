import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getContent, saveContent, Collection } from "@/lib/content";

export const dynamic = "force-dynamic";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

// POST /api/admin/reorder
// Body: { section, year, collections } — full reordered collections array for that year
export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { section: string; year: string; collections: Collection[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { section, year, collections } = body;
  if (!section || !year || !Array.isArray(collections)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (section !== "bridal" && section !== "couture") {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const content = await getContent();
  const sec = content[section as "bridal" | "couture"];
  if (!sec?.years?.[year]) {
    return NextResponse.json({ error: "Year not found" }, { status: 404 });
  }

  sec.years[year].collections = collections;
  await saveContent(content);
  revalidatePath(`/${section}/[year]`, "page");
  revalidatePath(`/${section}/all`);

  return NextResponse.json({ ok: true });
}
