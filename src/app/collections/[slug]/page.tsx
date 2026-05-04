import { getContent } from "@/lib/content";
import MasonryGallery from "@/components/MasonryGallery";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CollectionSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const collections = content.collections ?? [];
  const col = collections.find((c) => c.slug === slug);
  if (!col) return notFound();

  return (
    <main className="bg-white pt-24 sm:pt-32 md:pt-[180px] lg:pt-[220px]">
      <div className="py-6 sm:py-8 text-center container-custom">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.1em] text-[#1a1a1a] leading-none mb-3 sm:mb-4">
          {col.title}
        </h1>
        <p className="text-[10px] tracking-[4px] sm:tracking-[6px] text-[#b3a384] uppercase font-bold">
          Editorial Collection
        </p>
      </div>
      <div className="px-3 sm:px-6 md:px-10 pb-12 sm:pb-16">
        <MasonryGallery images={col.images ?? []} />
      </div>
    </main>
  );
}
