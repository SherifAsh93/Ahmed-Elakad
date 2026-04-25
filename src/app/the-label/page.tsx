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
  const heroImage =
    page.heroImage ||
    "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524478/1_121_ogym9l.jpg";

  const fallbackImages = [
    {
      src: "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524478/1_121_ogym9l.jpg",
      alt: "Collection piece 1",
    },
    {
      src: "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524406/1_104_h6cgdb.jpg",
      alt: "Collection piece 2",
    },
    {
      src: "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524311/1_79_ulp8m9.jpg",
      alt: "Collection piece 3",
    },
    {
      src: "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524220/1_49_izmifp.jpg",
      alt: "Collection piece 4",
    },
  ];

  return (
    <main className="bg-white">
      {/* ── Hero ── */}
      <div className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] min-h-[260px] flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Ahmed The Label"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/25 to-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 mt-14 sm:mt-16 w-full">
          <p className="font-serif text-white/70 text-xs sm:text-sm tracking-[0.35em] uppercase mb-3 sm:mb-4">
            Ahmed Elakad
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-white uppercase tracking-[0.18em] sm:tracking-[0.25em] leading-none mb-4 sm:mb-6">
            THE LABEL
          </h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-px w-10 sm:w-16 bg-white/40" />
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="h-px w-10 sm:w-16 bg-white/40" />
          </div>
        </div>
      </div>

      {/* ── Intro strip ── */}
      <div className="w-full border-b border-gray-100 py-6 sm:py-8 flex items-center justify-center">
        <p className="font-serif italic text-gray-400 text-sm sm:text-base tracking-wide text-center px-6">
          Exclusive editorial pieces — crafted for the modern woman
        </p>
      </div>

      {/* ── Gallery ── */}
      <section className="py-10 sm:py-16 w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12">
        {gallery.length > 0 ? (
          <MasonryGallery images={gallery} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {fallbackImages.map((img, i) => (
              <div
                key={i}
                className="overflow-hidden group w-full aspect-[3/4]"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
