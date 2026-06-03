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

  /* ── Hero ──────────────────────────────────────────────────── */
  const heroImage      = home.heroImage      || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776522163/1_21_iznofv.jpg";
  const heroLabel      = home.heroLabel      || "Bespoke Bridal Couture";
  const heroHeading    = home.heroHeading    || "Crafting Bridal\nDreams";
  const heroSubtitle   = home.heroSubtitle   || "One Couture Creation at a Time";
  const heroDesc       = home.heroDescription || "Bespoke bridal couture designed and handcrafted in Cairo for brides who seek elegance, artistry, and timeless beauty.";
  const heroCTAText    = home.heroCTAText    || "Book a Private Appointment";
  const heroCTAHref    = home.heroCTAHref    || "/contact";

  /* ── The House of Ahmed Elakad ─────────────────────────────── */
  const houseImage = about.sideImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const bio        = about.bio ?? [];

  /* ── Collections ───────────────────────────────────────────── */
  const bridalBanner  = bridal.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524478/1_121_ogym9l.jpg";
  const coutureBanner = couture.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const modest        = (bridal.gallery ?? [])[1] || bridalBanner;

  const c1img   = home.collection1Image || bridalBanner;
  const c1label = home.collection1Label || "Bridal Collection";
  const c1href  = home.collection1Href  || "/bridal";
  const c2img   = home.collection2Image || coutureBanner;
  const c2label = home.collection2Label || "Evening Couture";
  const c2href  = home.collection2Href  || "/couture";
  const c3img   = home.collection3Image || modest;
  const c3label = home.collection3Label || "Modest Bridal";
  const c3href  = home.collection3Href  || "/bridal";

  /* ── Real Brides ───────────────────────────────────────────── */
  const brides = (home.featuredImages ?? []).slice(0, 6);

  /* ── Bridal Journey CTA ────────────────────────────────────── */
  const ctaImg  = home.ctaImage       || (home.featuredImages ?? [])[6] || houseImage;
  const ctaHead = home.ctaHeading     || "Bridal Journey";
  const ctaDesc = home.ctaDescription || "Private consultations are available by appointment only at our Cairo atelier.";
  const ctaBtn  = home.ctaButtonText  || "Reserve Your Consultation";
  const ctaHref = home.ctaButtonHref  || "/contact";

  return (
    <main>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-screen min-h-[680px] overflow-hidden">
        <img
          src={optimizeImage(heroImage)}
          alt="Ahmed Elakad Couture"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Text — bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 pb-16 sm:pb-24 px-7 sm:px-14 md:px-20 max-w-[1440px] mx-auto">
          {/* Label */}
          <div className="flex items-center gap-3 mb-5">
            <span className="block w-8 h-px bg-white/50 shrink-0" />
            <span className="text-[9px] tracking-[4px] uppercase text-white/70 font-light">
              {heroLabel}
            </span>
          </div>
          {/* Heading */}
          <h1 className="font-serif font-light leading-[0.95] text-white mb-4 text-[46px] sm:text-[64px] md:text-[76px] whitespace-pre-line max-w-xl">
            {heroHeading}
          </h1>
          {/* Italic subtitle */}
          <p className="font-serif italic text-white/90 mb-5 text-[17px] sm:text-[22px] leading-snug">
            {heroSubtitle}
          </p>
          {/* Description */}
          <p className="text-[12.5px] text-white/65 leading-relaxed font-light mb-9 max-w-xs">
            {heroDesc}
          </p>
          {/* CTA */}
          <Link
            href={heroCTAHref}
            className="inline-flex items-center gap-3 border border-white/55 text-white text-[9px] tracking-[3px] uppercase px-7 py-4 hover:bg-white hover:text-black transition-all duration-300 w-fit"
          >
            {heroCTAText}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Down arrow */}
        <div className="absolute bottom-7 left-7 sm:left-14 md:left-20">
          <svg width="13" height="22" viewBox="0 0 13 26" fill="none" stroke="white" strokeWidth="1" opacity="0.4">
            <line x1="6.5" y1="0" x2="6.5" y2="24" />
            <path d="M1 18 L6.5 24 L12 18" />
          </svg>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          THE HOUSE OF AHMED ELAKAD
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#f9f7f4]">
        {/* Mobile: image first, text below — Desktop: side by side */}
        <div className="flex flex-col md:grid md:grid-cols-[38%_62%]">

          {/* Text column — shown BELOW image on mobile */}
          <div className="order-2 md:order-1 flex flex-col justify-center px-7 sm:px-14 md:pl-20 lg:pl-28 md:pr-10 py-12 md:py-24">
            <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-3">
              The House of
            </p>
            <h2 className="font-serif font-light text-[#1a1a1a] leading-tight mb-5 text-[34px] sm:text-[42px] md:text-[46px]">
              {content.siteInfo?.brandName ?? "Ahmed Elakad"}
            </h2>
            <div className="w-8 h-px bg-[#b3a384] mb-7" />
            <div className="space-y-4 text-[13px] text-[#5a5a5a] leading-[1.8] font-light max-w-sm">
              {bio.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
              {bio.length === 0 && (
                <>
                  <p>For over a decade, Ahmed Elakad Couture has been dedicated to creating bridal masterpieces that celebrate femininity, craftsmanship, and individuality.</p>
                  <p>Each gown is meticulously handcrafted, combining couture techniques, intricate embellishments, and personalized fittings to ensure each bride experiences a dress made uniquely for her.</p>
                </>
              )}
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-3 mt-9 text-[9px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors font-medium"
            >
              Discover Our Story
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Image — shown FIRST on mobile */}
          <div className="order-1 md:order-2 h-[280px] sm:h-[400px] md:h-[600px] overflow-hidden">
            <img
              src={optimizeImage(houseImage)}
              alt="Craftsmanship at Ahmed Elakad"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          COLLECTIONS
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#f9f7f4] py-14 sm:py-20 md:py-24 px-5 sm:px-10 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-3">
              Couture Collections
            </p>
            <h2 className="font-serif font-light text-[#1a1a1a] text-[30px] sm:text-[40px] md:text-[46px]">
              Discover Our Collections
            </h2>
          </div>

          {/* Cards — 1 col on small mobile, 3 col on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { img: c1img, label: c1label, href: c1href },
              { img: c2img, label: c2label, href: c2href },
              { img: c3img, label: c3label, href: c3href },
            ].map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="relative block overflow-hidden group"
                style={{ aspectRatio: "3/4" }}
              >
                <img
                  src={optimizeImage(card.img)}
                  alt={card.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-[10px] tracking-[3px] uppercase text-white font-medium mb-2">
                    {card.label}
                  </p>
                  <span className="inline-flex items-center gap-2 text-[8.5px] tracking-[2px] uppercase text-white/65 group-hover:text-white transition-colors">
                    Explore
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          REAL BRIDES
      ══════════════════════════════════════════════════════════ */}
      {brides.length > 0 && (
        <section className="bg-[#f9f7f4] py-14 sm:py-20">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-10 md:px-20">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-11">
              <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-3">
                Real Brides
              </p>
              <h2 className="font-serif font-light text-[#1a1a1a] text-[28px] sm:text-[38px] md:text-[44px]">
                Real Moments. Real Love.
              </h2>
            </div>

            {/* Grid — 3 col on mobile, 6 on desktop */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
              {brides.map((img, i) => (
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
            <div className="text-center mt-8 sm:mt-10">
              <Link
                href="/bridal"
                className="inline-flex items-center gap-3 text-[9px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors border-b border-[#1a1a1a]/25 pb-1 hover:border-[#b3a384]"
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


      {/* ══════════════════════════════════════════════════════════
          BRIDAL JOURNEY
      ══════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#ece7de] overflow-hidden py-24 sm:py-32 md:py-40">
        {/* Decorative side image */}
        <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-[200px] md:w-[340px] pointer-events-none select-none">
          <img
            src={optimizeImage(ctaImg)}
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#ece7de]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-md mx-auto">
          <p className="text-[9px] tracking-[4px] uppercase text-[#b3a384] font-medium mb-4">
            Begin Your
          </p>
          <h2 className="font-serif font-light text-[#1a1a1a] leading-tight mb-5 text-[40px] sm:text-[50px] md:text-[56px]">
            {ctaHead}
          </h2>
          <div className="w-8 h-px bg-[#b3a384] mx-auto mb-7" />
          <p className="text-[13px] text-[#6a6a6a] leading-relaxed font-light mb-10">
            {ctaDesc}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white text-[9px] tracking-[3px] uppercase px-9 py-4 hover:bg-[#b3a384] transition-colors duration-300"
          >
            {ctaBtn}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </main>
  );
}
