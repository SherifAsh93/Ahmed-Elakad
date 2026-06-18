/* eslint-disable @next/next/no-img-element */
import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";


export default async function AboutPage() {
  const content = await getContent();
  const about = content.about ?? {};
  const bio: string[] = about.bio ?? [];
  const gallery: string[] = about.gallery ?? [];

  const tagline = about.tagline || "Couture is not just what you wear, it is how you feel.";
  const heroImage = about.portraitImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524454/1_112_zmxnrk.jpg";
  const storyImage = gallery[0] || heroImage;

  const allParagraphs = bio.flatMap((p) => p.split("\n").filter(Boolean));

  return (
    <div className="bg-[#f9f7f4]">

      {/* ── HERO: full-width banner with overlay ── */}
      <section className="relative w-full h-[50vh] sm:h-[52vh] flex items-center justify-center overflow-hidden">
        <img
          src={optimizeImage(heroImage)}
          alt="Ahmed Elakad Couture"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/52" />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-display text-[46px] sm:text-[64px] md:text-[84px] uppercase tracking-[0.1em] text-white leading-none mb-5">
            ABOUT US
          </h1>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#b3a384]" />
            <div className="w-[5px] h-[5px] rotate-45 bg-[#b3a384] shrink-0" />
            <div className="w-8 h-px bg-[#b3a384]" />
          </div>
          <p className="text-[8px] sm:text-[9px] tracking-[5px] uppercase text-white/65">
            TIMELESS COUTURE, UNIQUELY YOURS.
          </p>
        </div>
      </section>

      {/* ── OUR STORY: text left + image right ── */}
      <section className="bg-[#f9f7f4] py-8 sm:py-12 md:py-16 px-4 sm:px-10 md:px-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-[42%_55%] gap-4 sm:gap-10 md:gap-14 items-center">

          {/* Left: text */}
          <div>
            <p className="font-serif italic text-[#b3a384] text-[10px] sm:text-[13px] mb-1">
              {content.siteInfo?.brandName ?? "Ahmed Elakad"}
            </p>
            <h2 className="font-display text-[14px] sm:text-[20px] md:text-[24px] uppercase tracking-[0.12em] text-[#1a1a1a] leading-tight mb-2">
              OUR STORY
            </h2>
            <div className="w-5 h-px bg-[#b3a384] mb-3" />
            <div className="space-y-2">
              {allParagraphs.length > 0 ? (
                allParagraphs.slice(0, 3).map((p, i) => (
                  <p key={i} className="text-[#555] text-[9px] sm:text-[12px] leading-[1.75] font-light font-serif">
                    {p}
                  </p>
                ))
              ) : (
                <>
                  <p className="text-[#555] text-[9px] sm:text-[12px] leading-[1.75] font-light font-serif">
                    Ahmed Elakad Couture House is a destination for custom-made bridal and evening wear, where craftsmanship meets timeless sophistication.
                  </p>
                  <p className="text-[#555] text-[9px] sm:text-[12px] leading-[1.75] font-light font-serif">
                    Every design is created with exceptional attention to detail, combining luxurious fabrics, intricate hand embroidery, and couture techniques to celebrate individuality and femininity.
                  </p>
                  <p className="text-[#555] text-[9px] sm:text-[12px] leading-[1.75] font-light font-serif">
                    Our philosophy is simple: every woman deserves a gown that feels uniquely hers — elegant, unforgettable, and crafted to perfection.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right: image */}
          <div className="w-full overflow-hidden aspect-[3/4] sm:aspect-[4/3] md:aspect-auto md:h-[400px]">
            <img
              src={optimizeImage(storyImage)}
              alt="Ahmed Elakad Atelier"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── OUR ATELIER: center heading + 4-col images ── */}
      {gallery.some(Boolean) && (
        <section className="bg-[#f5f2ee] py-8 sm:py-12 md:py-16 px-6 sm:px-12 md:px-20">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-5 sm:mb-8">
              <p className="text-[7px] tracking-[5px] uppercase text-[#b3a384] mb-2">Our Atelier</p>
              <h2 className="font-display text-[12px] sm:text-[16px] md:text-[20px] uppercase tracking-[0.2em] text-[#1a1a1a] mb-3">
                A PRIVATE SPACE FOR COUTURE CREATION
              </h2>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-px bg-[#b3a384]" />
                <div className="w-[4px] h-[4px] rotate-45 bg-[#b3a384] shrink-0" />
                <div className="w-8 h-px bg-[#b3a384]" />
              </div>
              <p className="text-[11px] sm:text-[12px] text-[#666] font-light font-serif max-w-[480px] mx-auto leading-relaxed">
                Designed for personalized consultations, fittings, and bespoke experiences.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.slice(0, 4).map((img, i) =>
                img ? (
                  <div key={i} className="flex-none w-[72vw] sm:w-[48vw] md:w-[calc(25%-9px)] snap-start aspect-[3/4] overflow-hidden">
                    <img
                      src={optimizeImage(img)}
                      alt="Atelier"
                      className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                ) : null
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM QUOTE ── */}
      <section className="bg-[#f9f7f4] py-12 sm:py-16 px-6 text-center">
        <div className="font-serif text-[36px] text-[#b3a384] leading-none mb-4 select-none">&ldquo;</div>
        <p className="font-serif italic text-[#555] text-[14px] sm:text-[16px] leading-relaxed max-w-[480px] mx-auto mb-4">
          {tagline}
        </p>
        <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-medium">
          — {content.siteInfo?.brandName ?? "Ahmed Elakad"}
        </p>
      </section>

    </div>
  );
}
