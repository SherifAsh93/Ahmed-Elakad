import { getContent } from "@/lib/content";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Couture",
  description: "Exclusive couture collections by Ahmed Elakad.",
};

const ALL_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];

export default async function CouturePage() {
  const content = await getContent();
  const years = content.couture?.years ?? {};

  // Redirect to latest year with content, or default to 2026
  const yearsWithContent = ALL_YEARS.filter((y) =>
    y in years && (years[y].collections ?? []).some((c) => c.images.length > 0)
  );

  const target = yearsWithContent[0] ?? "2026";
  redirect(`/couture/${target}`);
}
