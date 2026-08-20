/* eslint-disable @next/next/no-img-element */
import { getContent, Testimonial, VideoItem } from "@/lib/content";
import { signedImageUrl } from "@/lib/cloudinaryImage";
import Link from "next/link";
import TestimonialsSection from "./TestimonialsSection";
import VideosSection from "./VideosSection";


function hasValidUrl(v: VideoItem) {
  return (
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(v.url) ||
    /vimeo\.com\/\d+/.test(v.url) ||
    /instagram\.com\/(?:p|reel|tv)\//.test(v.url) ||
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(v.url)
  );
}

export default async function ExperiencePage() {
  const content = await getContent();
  const exp = content.experience ?? {};

  const heroImage = exp.heroImage || "";
  const heroSubheading = exp.heroSubheading || "THE ELAKAD";
  const heroHeading = exp.heroHeading || "EXPERIENCE";
  const heroDescriptions: string[] = exp.heroDescriptions ?? [
    "Every gown we create is more than a design — it is a personal journey built on trust, passion, and the finest craftsmanship.",
    "Discover the words of our clients who lived the Elakad Experience.",
  ];

  const kindWordsTitle = exp.kindWordsTitle || "KIND WORDS";
  const kindWordsIntro = exp.kindWordsIntro ||
    "We are honored to be a part of our clients' most special moments.\nHere is what they have to say about their journey with us.";
  const kindWordsBgImage = exp.kindWordsBgImage || "";

  const testimonials: Testimonial[] = exp.testimonials ?? [];
  const videos: VideoItem[] = (exp.videos ?? []).filter(hasValidUrl);

  const ctaImage = exp.ctaImage || heroImage;
  const ctaHeading = exp.ctaHeading || "YOUR STORY";
  const ctaSubtitle = exp.ctaSubtitle || "deserves to be extraordinary";
  const ctaText = exp.ctaText || "We would be honored to create something uniquely yours.";

  return (
    <main className="bg-[#f9f7f4]">

      {/* ── HERO — bottom-left text, AE monogram right ── */}
      <section className="relative w-full min-h-[60vh] md:min-h-[75vh] flex items-end overflow-hidden">
        {heroImage ? (
          <img
            src={signedImageUrl(heroImage, 1600)}
            alt="The Elakad Experience"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-[#1a1a1a]" />
        )}
        <div className="absolute inset-0 bg-black/45" />

        {/* AE monogram — right, desktop only */}
        <div className="absolute right-[8%] lg:right-[12%] top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center pointer-events-none select-none opacity-25">
          <span className="font-display text-[70px] lg:text-[90px] text-white leading-none tracking-[0.1em]">Æ</span>
          <p className="text-[7px] tracking-[4px] uppercase text-white mt-1">Ahmed Elakad</p>
          <p className="text-[6px] tracking-[3px] uppercase text-white/70 mt-0.5">Couture House</p>
        </div>

        {/* Bottom-left content */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-8 sm:px-14 md:px-20 pb-14 sm:pb-20 pt-28">
          <p className="text-[9px] tracking-[5px] uppercase text-white/60 font-medium mb-3">
            {heroSubheading}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl uppercase tracking-[0.25em] text-white leading-tight mb-5 drop-shadow-2xl">
            {heroHeading}
          </h1>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-[#b3a384]" />
            <div className="w-[4px] h-[4px] rotate-45 bg-[#b3a384] shrink-0" />
            <div className="w-8 h-px bg-[#b3a384]" />
          </div>
          <div className="space-y-3 max-w-[420px]">
            {heroDescriptions.map((d, i) => (
              <p key={i} className="text-white/65 text-[12px] sm:text-[13px] leading-[1.8] font-light">
                {d}
              </p>
            ))}
          </div>
        </div>
      </section>


      {/* ── KIND WORDS ── */}
      <section className="relative py-16 sm:py-20 md:py-24 px-5 sm:px-10">
        {/* Same hero image, light warm overlay */}
        {heroImage && (
          <img src={signedImageUrl(heroImage, 800)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-[#f5f0e8]/90" />

        <div className="relative z-10 max-w-screen-xl mx-auto">

          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-12 sm:w-16 h-px bg-[#b3a384]" />
            <span className="text-[9px] tracking-[5px] uppercase text-[#b3a384] font-medium whitespace-nowrap">Client Love</span>
            <div className="w-12 sm:w-16 h-px bg-[#b3a384]" />
          </div>

          {/* Heading */}
          <h2 className="font-display text-[30px] sm:text-[38px] md:text-[46px] uppercase tracking-[0.25em] text-[#1a1a1a] text-center mb-3">
            {kindWordsTitle}
          </h2>

          {/* Diamond separator */}
          <div className="flex items-center justify-center gap-2 mb-7">
            <div className="w-7 h-px bg-[#b3a384]/40" />
            <div className="w-[4px] h-[4px] rotate-45 bg-[#b3a384]" />
            <div className="w-7 h-px bg-[#b3a384]/40" />
          </div>

          {/* Intro */}
          {kindWordsIntro && (
            <div className="text-center mb-10 max-w-[540px] mx-auto">
              {kindWordsIntro.split("\n").map((line, i) => (
                <p key={i} className="text-[#666] text-[13px] sm:text-[14px] leading-[1.75] font-light font-serif">{line}</p>
              ))}
            </div>
          )}

          {/* 3 cards in one row — horizontal scroll on mobile */}
          <TestimonialsSection testimonials={testimonials} />

        </div>
      </section>


      {/* ── CLIENT VIDEOS ── */}
      {videos.length > 0 && (
        <section className="bg-[#f5f2ee] py-6 sm:py-10 md:py-14">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-10 md:px-20">
            <VideosSection
              videos={videos}
              title={exp.videoSectionTitle || "CLIENT STORIES"}
              subtitle={exp.videoSectionSubtitle}
            />
          </div>
        </section>
      )}


      {/* ── YOUR STORY CTA — single unified layout matching template ── */}
      <section className="relative w-full min-h-[40vh] flex items-center overflow-hidden">
        {ctaImage ? (
          <img src={signedImageUrl(ctaImage, 800)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 bg-[#1a1a1a]" />
        )}
        <div className={`absolute inset-0 ${ctaImage ? "bg-black/52" : "bg-transparent"}`} />

        <div className="relative z-10 w-full px-6 sm:px-12 md:px-20 py-14 sm:py-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 sm:gap-16 max-w-[1440px] mx-auto">

          {/* Left: text */}
          <div className="flex-1">
            <h2 className="font-display text-[20px] sm:text-[28px] md:text-[36px] uppercase tracking-[0.15em] text-white leading-tight mb-2">
              {ctaHeading}
            </h2>
            {ctaSubtitle && (
              <p className="font-serif italic text-[#b3a384] text-[13px] sm:text-[16px] mb-4">{ctaSubtitle}</p>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-[#b3a384]" />
              <div className="w-[4px] h-[4px] rotate-45 bg-[#b3a384] shrink-0" />
              <div className="w-6 h-px bg-[#b3a384]" />
            </div>
            <p className="text-[10px] sm:text-[12px] leading-relaxed font-light text-white/65 max-w-[340px]">
              {ctaText}
            </p>
          </div>

          {/* Right: button */}
          <div className="flex-shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 border border-white/50 text-white text-[7px] sm:text-[8px] tracking-[3px] uppercase px-6 sm:px-10 py-3 sm:py-4 hover:bg-white hover:text-black transition-all duration-300 whitespace-nowrap"
            >
              Book Your Appointment
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
