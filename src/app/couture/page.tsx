import { redirect } from "next/navigation";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Couture",
  description: "Exclusive couture collections by Ahmed Elakad.",
};

export default async function CouturePage() {
  redirect("/couture/all");
}
