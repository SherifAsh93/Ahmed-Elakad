import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Couture",
  description: "Exclusive couture collections by Ahmed Elakad.",
};

export default async function CouturePage() {
  redirect("/couture/all");
}
