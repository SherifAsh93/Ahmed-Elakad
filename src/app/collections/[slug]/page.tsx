import { getContent } from "@/lib/content";
import MasonryGallery from "@/components/MasonryGallery";
import { notFound } from "next/navigation";

export default async function CollectionSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getContent();
  const col = (content.collections ?? []).find((c: any) => c.slug === slug);
  if (!col) return notFound();

  return (
    <main className="bg-white pt-32 md:pt-[220px]">
      <div className="py-8 text-center container-custom">
        <h1 className="font-display text-4xl uppercase tracking-[0.1em] text-[#1a1a1a] leading-none mb-4">
          {col.title}
        </h1>
        <p className="text-[10px] tracking-[6px] text-[#b3a384] uppercase font-bold">
          Editorial Collection
        </p>
      </div>
      <div className="px-4 md:px-10 pb-16">
        <MasonryGallery images={col.images ?? []} />
      </div>
    </main>
  );
}
