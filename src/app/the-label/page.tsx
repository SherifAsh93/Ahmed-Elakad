import { getContent } from "@/lib/content";
import MasonryGallery from "@/components/MasonryGallery";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Label",
  description:
    "Ahmed The Label - Exclusive editorial collection by Ahmed Elakad.",
};

export default async function TheLabelPage() {
  const content = await getContent();
  const page = content.theLabelPage ?? {};
  const gallery = page.gallery ?? [];
  const heroImage = page.heroImage || "/images/1 (75).jpg";

  return (
    <main className="bg-white">
      <div className="relative h-[45vh] min-h-[300px] flex items-center justify-center">
        <img
          src={heroImage}
          alt="Ahmed The Label"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <h1 className="font-display text-4xl md:text-6xl text-white uppercase tracking-[0.2em] leading-none mb-4">
            THE LABEL
          </h1>
          <div className="h-px w-20 bg-white/40 mx-auto"></div>
        </div>
      </div>

      {/* ── Condensed Gallery Section ─────────────────────────── */}
      <section className="py-12 container-custom">
        {gallery.length > 0 ? (
          <MasonryGallery images={gallery} />
        ) : (
          <div className="text-center py-24">
            <p className="font-serif italic text-gray-400">
              The collection is currently being curated.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
