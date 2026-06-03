/* eslint-disable @next/next/no-img-element */
import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AboutPage() {
  const content = await getContent();
  const about = content.about ?? {};
  const bio: string[] = about.bio ?? [];
  const gallery: string[] = about.gallery ?? [];

  const allParagraphs = bio.flatMap((p) => p.split("\n").filter(Boolean));
  const heroParagraphs = allParagraphs.slice(0, 2);
  const extraParagraphs = allParagraphs.slice(2);

  const tagline = about.tagline || "Crafted for the woman\nwho seeks the exceptional.";

  const galleryImages = [
    gallery[0] || null,
    gallery[1] || null,
    gallery[2] || null,
    gallery[3] || null,
  ];
  const hasGallery = galleryImages.some(Boolean);

  return (
    <div className="bg-[#f9f7f4]">

      {/* ── HERO: text left + image right ── */}
      <section className="flex flex-col md:flex-row min-h-screen">

        {/* LEFT — warm cream panel */}
        <div className="w-full md:w-[46%] bg-[#f9f7f4] flex flex-col justify-center px-8 sm:px-14 md:px-16 lg:px-24 pt-32 pb-16 md:pt-28 md:pb-20">

          <h1 className="font-display text-[58px] sm:text-[72px] md:text-[80px] lg:text-[96px] uppercase leading-[0.9] tracking-[0.04em] text-[#1a1a1a] mb-7">
            ABOUT<br />US
          </h1>

          {/* Gold divider with diamond */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-px bg-[#b3a384]" />
            <div className="w-[5px] h-[5px] rotate-45 bg-[#b3a384] shrink-0" />
            <div className="w-10 h-px bg-[#b3a384]" />
          </div>

          {/* Tagline */}
          <p className="font-serif italic text-[#b3a384] text-lg sm:text-xl md:text-2xl leading-snug mb-8 whitespace-pre-line">
            {tagline}
          </p>

          {/* Bio paragraphs */}
          <div className="space-y-4 mb-10">
            {heroParagraphs.length > 0 ? (
              heroParagraphs.map((p, i) => (
                <p key={i} className="text-[#666] text-[13px] sm:text-[14px] leading-[1.85] font-light font-serif">
                  {p}
                </p>
              ))
            ) : (
              <>
                <p className="text-[#666] text-[13px] sm:text-[14px] leading-[1.85] font-light font-serif">
                  Ahmed Elakad Couture House creates bespoke bridal and eveningwear defined by refined craftsmanship, exquisite fabrics, and meticulous hand embroidery.
                </p>
                <p className="text-[#666] text-[13px] sm:text-[14px] leading-[1.85] font-light font-serif">
                  Every design is a celebration of elegance, individuality, and timeless beauty.
                </p>
              </>
            )}
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-3 text-[9px] tracking-[4px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors border-b border-[#1a1a1a]/25 hover:border-[#b3a384] pb-1 w-fit"
          >
            EXPLORE THE ATELIER
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* RIGHT — portrait image */}
        <div className="w-full md:w-[54%] min-h-[72vw] md:min-h-0 overflow-hidden">
          <img
            src={optimizeImage(
              about.portraitImage ||
              "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524454/1_112_zmxnrk.jpg"
            )}
            alt="Ahmed Elakad Atelier"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* ── EXTRA BIO PARAGRAPHS ── */}
      {extraParagraphs.length > 0 && (
        <section className="bg-[#f9f7f4] py-20 sm:py-28 px-6">
          <div className="w-12 h-px bg-[#b3a384]/40 mx-auto mb-12" />
          <div className="max-w-[680px] mx-auto space-y-7 text-center">
            {extraParagraphs.map((p, i) => (
              <p key={i} className="text-[#555] leading-[2] text-base sm:text-lg font-light font-serif">
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ── GALLERY GRID ── */}
      {hasGallery && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-[2px] bg-[#e8e4de]">
          {/* Col 1 — tall left image */}
          <div className="row-span-2 md:row-span-1 overflow-hidden" style={{ minHeight: "320px" }}>
            {galleryImages[0] ? (
              <img
                src={optimizeImage(galleryImages[0])}
                alt="Atelier"
                className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#d5cfc5]" />
            )}
          </div>

          {/* Col 2 — top and bottom stacked */}
          <div className="grid grid-rows-2 gap-[2px]">
            <div className="overflow-hidden aspect-square">
              {galleryImages[1] ? (
                <img
                  src={optimizeImage(galleryImages[1])}
                  alt="Atelier detail"
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[#d5cfc5]" />
              )}
            </div>
            <div className="overflow-hidden aspect-square">
              {galleryImages[2] ? (
                <img
                  src={optimizeImage(galleryImages[2])}
                  alt="Atelier sign"
                  className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-[#d5cfc5]" />
              )}
            </div>
          </div>

          {/* Col 3 — tall right image */}
          <div className="row-span-2 md:row-span-1 overflow-hidden" style={{ minHeight: "320px" }}>
            {galleryImages[3] ? (
              <img
                src={optimizeImage(galleryImages[3])}
                alt="Atelier studio"
                className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#d5cfc5]" />
            )}
          </div>
        </section>
      )}

      {/* ── BOTTOM BRAND BAR ── */}
      <section className="bg-[#f9f7f4] border-t border-[#e0dbd3] py-8 px-6">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
          <span className="text-[8px] tracking-[5px] uppercase text-[#aaa] font-medium">
            Bespoke Couture
          </span>
          <div className="flex items-center gap-3 text-[#b3a384]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            <span className="font-display text-xl text-[#b3a384] tracking-widest">Æ</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </div>
          <span className="text-[8px] tracking-[5px] uppercase text-[#aaa] font-medium">
            Handcrafted with Passion
          </span>
        </div>
      </section>

    </div>
  );
}
