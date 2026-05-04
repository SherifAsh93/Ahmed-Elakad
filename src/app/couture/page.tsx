import { getContent } from "@/lib/content";
import MasonryGallery from "@/components/MasonryGallery";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Couture",
  description: "Exclusive couture collections by Ahmed Elakad.",
};

export default async function CouturePage() {
  const content = await getContent();
  const coutureImages = content.couture?.gallery ?? [];

  return (
    <main className="bg-white pt-24 sm:pt-32 md:pt-[180px] lg:pt-[220px]">
      <div className="py-6 sm:py-8 text-center container-custom">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.1em] text-[#1a1a1a] leading-none mb-3 sm:mb-4">
          COUTURE
        </h1>
        <p className="text-[10px] tracking-[4px] sm:tracking-[6px] text-[#b3a384] uppercase font-bold">
          Exclusive Collections
        </p>
      </div>
      <div className="px-3 sm:px-6 md:px-10 pb-12 sm:pb-16 max-w-screen-xl mx-auto">
        <MasonryGallery images={coutureImages} />
      </div>
    </main>
  );
}
