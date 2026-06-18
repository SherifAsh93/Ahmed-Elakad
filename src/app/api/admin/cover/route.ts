import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getContent, saveContent } from "@/lib/content";

export const dynamic = "force-dynamic";

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { section, year, collectionId, coverIndex } = await req.json();

  if (!section || !year || !collectionId || typeof coverIndex !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (section !== "bridal" && section !== "couture") {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const content = await getContent();
  const collections = content[section as "bridal" | "couture"]?.years?.[year]?.collections;
  if (!collections) return NextResponse.json({ error: "Year not found" }, { status: 404 });

  const coll = collections.find((c) => c.id === collectionId);
  if (!coll) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  coll.coverIndex = coverIndex;
  await saveContent(content);
  revalidatePath(`/${section}/[year]`, "page");
  revalidatePath(`/${section}/all`);

  return NextResponse.json({ ok: true });
}
