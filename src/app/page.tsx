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

  // Hero
  const heroImage = home.heroImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776522163/1_21_iznofv.jpg";
  const heroLabel = home.heroLabel || "Bespoke Bridal Couture";
  const heroHeading = home.heroHeading || "Crafting Bridal Dreams";
  const heroSubtitle = home.heroSubtitle || "One Couture Creation at a Time";
  const heroDescription = home.heroDescription || "Bespoke bridal couture designed and handcrafted in Cairo for brides who seek elegance, artistry, and timeless beauty.";
  const heroCTAText = home.heroCTAText || "Book a Private Appointment";
  const heroCTAHref = home.heroCTAHref || "/contact";

  // House of Ahmed Elakad — text from About, image from About sideImage
  const aboutImage = about.sideImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const bio = about.bio ?? [];

  // Collections
  const bridalBanner = bridal.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524478/1_121_ogym9l.jpg";
  const coutureBanner = couture.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const modestFallback = (bridal.gallery ?? [])[1] || bridalBanner;

  const coll1Image = home.collection1Image || bridalBanner;
  const coll1Label = home.collection1Label || "Bridal Collection";
  const coll1Href  = home.collection1Href  || "/bridal";
  const coll2Image = home.collection2Image || coutureBanner;
  const coll2Label = home.collection2Label || "Evening Couture";
  const coll2Href  = home.collection2Href  || "/couture";
  const coll3Image = home.collection3Image || modestFallback;
  const coll3Label = home.collection3Label || "Modest Bridal";
  const coll3Href  = home.collection3Href  || "/bridal";

  // Real Brides
  const featuredImages = (home.featuredImages ?? []).slice(0, 6);

  // Bridal Journey CTA
  const ctaDecorFallback = (home.featuredImages ?? [])[6] || aboutImage;
  const ctaImage       = home.ctaImage       || ctaDecorFallback;
  const ctaHeading     = home.ctaHeading     || "Bridal Journey";
  const ctaDescription = home.ctaDescription || "Private consultations are available by appointment only at our Cairo atelier.";
  const ctaBtnText     = home.ctaButtonText  || "Reserve Your Consultation";
  const ctaBtnHref     = home.ctaButtonHref  || "/contact";

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
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex flex-col justify-end pb-16 sm:pb-24 px-6 sm:px-14 md:px-20 max-w-[1440px] mx-auto left-0 right-0">
          <div className="flex items-center gap-4 mb-4 sm:mb-5">
            <span className="block w-8 h-[1px] bg-white/50" />
            <span className="text-[8px] tracking-[4px] uppercase text-white/70 font-medium">
              {heroLabel}
            </span>
          </div>
          <h1 className="font-serif text-[42px] sm:text-[62px] md:text-[76px] leading-[1.0] font-light text-white mb-3 sm:mb-4 max-w-[560px] whitespace-pre-line">
            {heroHeading}
          </h1>
          <p className="font-serif italic text-[16px] sm:text-[22px] text-white/85 mb-4 sm:mb-6 leading-snug">
            {heroSubtitle}
          </p>
          <p className="text-[12px] sm:text-[13px] text-white/65 leading-relaxed max-w-[320px] mb-8 sm:mb-10 font-light">
            {heroDescription}
          </p>
          <Link
            href={heroCTAHref}
            className="inline-flex items-center gap-3 border border-white/50 text-white text-[8px] sm:text-[9px] tracking-[3px] uppercase px-6 sm:px-7 py-3 sm:py-4 hover:bg-white hover:text-black transition-all duration-300 w-fit"
          >
            {heroCTAText}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-14 md:left-20">
          <svg width="14" height="22" viewBox="0 0 14 26" fill="none" stroke="white" strokeWidth="1" opacity="0.45">
            <line x1="7" y1="0" x2="7" y2="24" />
            <path d="M1 18 L7 24 L13 18" />
          </svg>
        </div>
      </section>

      {/* ── 2. The House of Ahmed Elakad ─────────────────────────── */}
      <section className="bg-[#f9f7f4] py-14 sm:py-20 md:py-28">
        <div className="grid grid-cols-[1fr_1.5fr]">
          <div className="pl-5 sm:pl-12 md:pl-20 lg:pl-28 pr-5 sm:pr-8 md:pr-12 pt-4 sm:pt-8 pb-6 sm:pb-0 flex flex-col justify-center">
            <p className="text-[7px] sm:text-[9px] tracking-[3px] sm:tracking-[4px] uppercase text-[#b3a384] font-medium mb-2 sm:mb-4">
              The House of
            </p>
            <h2 className="font-serif text-[22px] sm:text-[38px] md:text-[46px] leading-tight text-[#1a1a1a] font-light mb-3 sm:mb-6">
              {content.siteInfo?.brandName ?? "Ahmed Elakad"}
            </h2>
            <div className="w-6 sm:w-8 h-[1px] bg-[#b3a384] mb-4 sm:mb-8" />
            <div className="space-y-3 text-[10px] sm:text-[13.5px] text-[#5a5a5a] leading-relaxed font-light">
              {bio.slice(0, 2).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {bio.length === 0 && (
                <>
                  <p>For over a decade, Ahmed Elakad Couture has been dedicated to creating bridal masterpieces that celebrate femininity, craftsmanship, and individuality.</p>
                  <p>Each gown is meticulously handcrafted, combining couture techniques, intricate embellishments, and personalized fittings.</p>
                </>
              )}
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 mt-6 sm:mt-10 text-[7px] sm:text-[9.5px] tracking-[2px] sm:tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors"
            >
              Discover Our Story
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="h-[220px] sm:h-[480px] md:h-[580px] overflow-hidden">
            <img
              src={optimizeImage(aboutImage)}
              alt="Ahmed Elakad craftsmanship"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── 3. Couture Collections ────────────────────────────────── */}
      <section className="bg-[#f9f7f4] py-12 sm:py-20 md:py-24 px-4 sm:px-10 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-[7px] sm:text-[9px] tracking-[3px] sm:tracking-[4px] uppercase text-[#b3a384] font-medium mb-3 sm:mb-4">
              Couture Collections
            </p>
            <h2 className="font-serif text-[26px] sm:text-[38px] md:text-[44px] font-light text-[#1a1a1a]">
              Discover Our Collections
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { img: coll1Image, label: coll1Label, href: coll1Href },
              { img: coll2Image, label: coll2Label, href: coll2Href },
              { img: coll3Image, label: coll3Label, href: coll3Href },
            ].map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="relative block aspect-[2/3] sm:aspect-[3/4] overflow-hidden group"
              >
                <img
                  src={optimizeImage(card.img)}
                  alt={card.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-5 md:p-7">
                  <p className="text-[6px] sm:text-[9px] md:text-[10px] tracking-[2px] sm:tracking-[3px] uppercase text-white font-medium mb-1 sm:mb-2 leading-tight">
                    {card.label}
                  </p>
                  <span className="hidden sm:inline-flex items-center gap-2 text-[7.5px] tracking-[2px] uppercase text-white/70 group-hover:text-white transition-colors">
                    Explore
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
        <section className="bg-[#f9f7f4] py-12 sm:py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-10 md:px-20">
            <div className="text-center mb-7 sm:mb-10">
              <p className="text-[7px] sm:text-[9px] tracking-[3px] sm:tracking-[4px] uppercase text-[#b3a384] font-medium mb-3 sm:mb-4">
                Real Brides
              </p>
              <h2 className="font-serif text-[24px] sm:text-[36px] md:text-[42px] font-light text-[#1a1a1a]">
                Real Moments. Real Love.
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
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
            <div className="text-center mt-6 sm:mt-8">
              <Link
                href="/bridal"
                className="inline-flex items-center gap-3 text-[8px] sm:text-[9.5px] tracking-[2px] sm:tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors border-b border-[#1a1a1a]/20 pb-1 hover:border-[#b3a384]"
              >
                View More Real Brides
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Begin Your Bridal Journey ─────────────────────────── */}
      <section className="relative bg-[#ede8df] overflow-hidden py-20 sm:py-28 md:py-32">
        <div className="absolute left-0 top-0 bottom-0 w-[100px] sm:w-[260px] md:w-[380px] pointer-events-none">
          <img
            src={optimizeImage(ctaImage)}
            alt=""
            className="w-full h-full object-cover object-center opacity-30 sm:opacity-25"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ede8df]" />
        </div>
        <div className="relative text-center px-6 max-w-lg mx-auto">
          <p className="text-[7px] sm:text-[9px] tracking-[3px] sm:tracking-[4px] uppercase text-[#b3a384] font-medium mb-3 sm:mb-4">
            Begin Your
          </p>
          <h2 className="font-serif text-[34px] sm:text-[44px] md:text-[52px] font-light text-[#1a1a1a] mb-4 sm:mb-6 leading-tight">
            {ctaHeading}
          </h2>
          <div className="w-7 h-[1px] bg-[#b3a384] mx-auto mb-6 sm:mb-8" />
          <p className="text-[12px] sm:text-[13px] text-[#6a6a6a] leading-relaxed mb-8 sm:mb-10 font-light">
            {ctaDescription}
          </p>
          <Link
            href={ctaBtnHref}
            className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white text-[8px] sm:text-[9px] tracking-[2px] sm:tracking-[3px] uppercase px-8 sm:px-10 py-3 sm:py-4 hover:bg-[#b3a384] transition-colors duration-300"
          >
            {ctaBtnText}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

    </main>
  );
}
