import { redirect } from "next/navigation";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Bridal",
  description: "Exclusive bridal collections by Ahmed Elakad.",
};

export default async function BridalPage() {
  redirect("/bridal/all");
}
