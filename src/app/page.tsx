import { getContent } from "@/lib/content";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const content = await getContent();
  const home = content.homepage ?? {};
  const about = content.about ?? {};
  const bridal = content.bridal ?? {};
  const couture = content.couture ?? {};

  const heroImage = home.heroImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776522163/1_21_iznofv.jpg";
  const aboutImage = about.sideImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const bridalBanner = bridal.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524478/1_121_ogym9l.jpg";
  const coutureBanner = couture.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const modestBridalImg = (bridal.gallery ?? [])[1] || bridalBanner;
  const featuredImages = (home.featuredImages ?? []).slice(0, 6);
  const ctaDecorImage = (home.featuredImages ?? [])[6] || aboutImage;
  const bio = about.bio ?? [];

  return (
    <main className="bg-[#f9f7f4]">

      {/* ── 1. Hero ───────────────────────────────────────────────── */}
      <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
        <img
          src={optimizeImage(heroImage)}
          alt="Ahmed Elakad Couture"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Hero content — left-aligned, lower third */}
        <div className="absolute inset-0 flex flex-col justify-end pb-20 sm:pb-24 px-8 sm:px-14 md:px-20 max-w-[1440px] mx-auto left-0 right-0">
          {/* Label with line */}
          <div className="flex items-center gap-4 mb-5">
            <span className="block w-10 h-[1px] bg-white/50" />
            <span className="text-[9px] tracking-[4px] uppercase text-white/70 font-medium">
              Bespoke Bridal Couture
            </span>
          </div>
          {/* Main heading */}
          <h1 className="font-serif text-[48px] sm:text-[62px] md:text-[76px] leading-[1.0] font-light text-white mb-4 max-w-[560px]">
            Crafting Bridal<br />Dreams
          </h1>
          {/* Italic subtitle */}
          <p className="font-serif italic text-[18px] sm:text-[22px] text-white/85 mb-6 leading-snug">
            One Couture Creation at a Time
          </p>
          {/* Description */}
          <p className="text-[13px] text-white/65 leading-relaxed max-w-[340px] mb-10 font-light">
            Bespoke bridal couture designed and handcrafted in Cairo for brides who seek elegance, artistry, and timeless beauty.
          </p>
          {/* CTA button */}
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 border border-white/50 text-white text-[9px] tracking-[3px] uppercase px-7 py-4 hover:bg-white hover:text-black transition-all duration-300 w-fit"
          >
            Book a Private Appointment
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Down arrow */}
        <div className="absolute bottom-8 left-8 sm:left-14 md:left-20">
          <svg width="16" height="24" viewBox="0 0 16 28" fill="none" stroke="white" strokeWidth="1" opacity="0.5">
            <line x1="8" y1="0" x2="8" y2="26" />
            <path d="M2 20 L8 26 L14 20" />
          </svg>
        </div>
      </section>

      {/* ── 2. The House of Ahmed Elakad ─────────────────────────── */}
      <section className="bg-[#f9f7f4] py-20 md:py-28 px-6 sm:px-10 md:px-0">
        <div className="max-w-[1440px] mx-auto md:grid md:grid-cols-[1fr_1.6fr] md:gap-0 md:items-start">
          {/* Text column */}
          <div className="md:pl-20 lg:pl-28 md:pr-14 md:pt-8 mb-10 md:mb-0">
            <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-4">
              The House of
            </p>
            <h2 className="font-serif text-[38px] sm:text-[46px] leading-tight text-[#1a1a1a] font-light mb-6">
              Ahmed Elakad
            </h2>
            <div className="w-8 h-[1px] bg-[#b3a384] mb-8" />
            <div className="space-y-4 text-[13.5px] text-[#5a5a5a] leading-relaxed font-light max-w-[340px]">
              {bio.slice(0, 2).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {bio.length === 0 && (
                <>
                  <p>For over a decade, Ahmed Elakad Couture has been dedicated to creating bridal masterpieces that celebrate femininity, craftsmanship, and individuality.</p>
                  <p>Each gown is meticulously handcrafted, combining couture techniques, intricate embellishments, and personalized fittings to ensure each bride experiences a dress made uniquely for her.</p>
                </>
              )}
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-3 mt-10 text-[9.5px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors"
            >
              Discover Our Story
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {/* Image column */}
          <div className="w-full aspect-[4/5] md:aspect-auto md:h-[580px] overflow-hidden">
            <img
              src={optimizeImage(aboutImage)}
              alt="Ahmed Elakad Couture craftsmanship"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── 3. Couture Collections ────────────────────────────────── */}
      <section className="bg-[#f9f7f4] py-20 md:py-24 px-6 sm:px-10 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-4">
              Couture Collections
            </p>
            <h2 className="font-serif text-[36px] sm:text-[44px] font-light text-[#1a1a1a]">
              Discover Our Collections
            </h2>
          </div>
          {/* 3-column cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { img: bridalBanner, label: "Bridal Collection", href: "/bridal" },
              { img: coutureBanner, label: "Evening Couture", href: "/couture" },
              { img: modestBridalImg, label: "Modest Bridal", href: "/bridal" },
            ].map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="relative block aspect-[3/4] overflow-hidden group"
              >
                <img
                  src={optimizeImage(card.img)}
                  alt={card.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <p className="text-[10px] tracking-[3px] uppercase text-white font-medium mb-2">
                    {card.label}
                  </p>
                  <span className="inline-flex items-center gap-2 text-[8.5px] tracking-[2.5px] uppercase text-white/70 group-hover:text-white transition-colors">
                    Explore
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Real Brides ────────────────────────────────────────── */}
      {featuredImages.length > 0 && (
        <section className="bg-[#f9f7f4] py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10 md:px-20">
            {/* Section header */}
            <div className="text-center mb-10">
              <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-4">
                Real Brides
              </p>
              <h2 className="font-serif text-[34px] sm:text-[42px] font-light text-[#1a1a1a]">
                Real Moments. Real Love.
              </h2>
            </div>
            {/* Image row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {featuredImages.map((img, i) => (
                <div key={i} className="aspect-[2/3] overflow-hidden">
                  <img
                    src={optimizeImage(img)}
                    alt={`Real bride ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            {/* Link */}
            <div className="text-center mt-8">
              <Link
                href="/bridal"
                className="inline-flex items-center gap-3 text-[9.5px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors border-b border-[#1a1a1a]/20 pb-1 hover:border-[#b3a384]"
              >
                View More Real Brides
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Begin Your Bridal Journey ─────────────────────────── */}
      <section className="relative bg-[#ede8df] overflow-hidden py-24 md:py-32">
        {/* Decorative image — left side */}
        <div className="absolute left-0 top-0 bottom-0 w-[220px] sm:w-[300px] md:w-[380px] opacity-25 pointer-events-none hidden sm:block">
          <img
            src={optimizeImage(ctaDecorImage)}
            alt=""
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ede8df]" />
        </div>
        {/* Content */}
        <div className="relative text-center px-6 max-w-lg mx-auto">
          <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-4">
            Begin Your
          </p>
          <h2 className="font-serif text-[42px] sm:text-[52px] font-light text-[#1a1a1a] mb-6 leading-tight">
            Bridal Journey
          </h2>
          <div className="w-8 h-[1px] bg-[#b3a384] mx-auto mb-8" />
          <p className="text-[13px] text-[#6a6a6a] leading-relaxed mb-10 font-light">
            Private consultations are available by appointment only at our Cairo atelier.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white text-[9px] tracking-[3px] uppercase px-10 py-4 hover:bg-[#b3a384] transition-colors duration-300"
          >
            Reserve Your Consultation
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </main>
  );
}
