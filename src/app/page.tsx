import { getContent } from "@/lib/content";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const content = await getContent();
  const home     = content.homepage ?? {};
  const about    = content.about    ?? {};
  const bridal   = content.bridal   ?? {};
  const couture  = content.couture  ?? {};

  const heroImage   = home.heroImage      || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776522163/1_21_iznofv.jpg";
  const heroLabel   = home.heroLabel      || "Bespoke Bridal Couture";
  const heroHeading = home.heroHeading    || "Crafting Bridal\nDreams";
  const heroSub     = home.heroSubtitle   || "One Couture Creation at a Time";
  const heroDesc    = home.heroDescription || "Bespoke bridal couture designed and handcrafted in Cairo for brides who seek elegance, artistry, and timeless beauty.";
  const heroCTA     = home.heroCTAText    || "Book a Private Appointment";
  const heroCTALink = home.heroCTAHref    || "/contact";

  const houseImg  = about.sideImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const bio       = about.bio ?? [];

  const c1i = home.collection1Image || bridal.bannerImage  || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524478/1_121_ogym9l.jpg";
  const c1l = home.collection1Label || "Bridal Collection";
  const c1h = home.collection1Href  || "/bridal";
  const c2i = home.collection2Image || couture.bannerImage || "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg";
  const c2l = home.collection2Label || "Evening Couture";
  const c2h = home.collection2Href  || "/couture";
  const c3i = home.collection3Image || (bridal.gallery ?? [])[1] || c1i;
  const c3l = home.collection3Label || "Modest Bridal";
  const c3h = home.collection3Href  || "/bridal";

  const brides   = (home.featuredImages ?? []).slice(0, 6);
  const ctaImg   = home.ctaImage       || (home.featuredImages ?? [])[6] || houseImg;
  const ctaHead  = home.ctaHeading     || "Bridal Journey";
  const ctaDesc  = home.ctaDescription || "Private consultations are available by appointment only at our Cairo atelier.";
  const ctaBtn   = home.ctaButtonText  || "Reserve Your Consultation";
  const ctaBtnHr = home.ctaButtonHref  || "/contact";

  return (
    <main className="bg-[#f5f2ee] overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative w-full h-screen min-h-[600px]">
        <img src={optimizeImage(heroImage)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />
        <div className="absolute inset-0 bg-black/40" />

        {/* Bottom-left content */}
        <div className="absolute bottom-0 left-0 right-0 pb-14 sm:pb-20 px-6 sm:px-12 md:px-20 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-7 h-px bg-white/50 shrink-0" />
            <span className="text-[8px] tracking-[4px] uppercase text-white/70">{heroLabel}</span>
          </div>
          <h1 className="font-serif font-light text-white leading-[1.0] whitespace-pre-line mb-4 text-[44px] sm:text-[62px] md:text-[72px] max-w-[520px]">
            {heroHeading}
          </h1>
          <p className="font-serif italic text-white/88 mb-4 text-[16px] sm:text-[21px] leading-snug">{heroSub}</p>
          <p className="text-[12px] text-white/62 leading-relaxed font-light mb-9 max-w-[300px]">{heroDesc}</p>
          <Link href={heroCTALink} className="inline-flex items-center gap-3 border border-white/50 text-white text-[8px] tracking-[3px] uppercase px-6 py-4 hover:bg-white hover:text-black transition-all duration-300 w-fit">
            {heroCTA}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        {/* Down arrow */}
        <div className="absolute bottom-6 left-6 sm:left-12 md:left-20">
          <svg width="12" height="22" viewBox="0 0 12 24" fill="none" stroke="white" strokeWidth="1" opacity="0.4">
            <line x1="6" y1="0" x2="6" y2="22"/><path d="M1 17 L6 22 L11 17"/>
          </svg>
        </div>
      </section>


      {/* ── THE HOUSE OF AHMED ELAKAD ─────────────────────────────── */}
      {/* TEXT left, IMAGE right — exactly like the template */}
      <section className="bg-[#f5f2ee]">
        <div className="grid grid-cols-[36%_64%]">

          {/* LEFT: Text */}
          <div className="flex flex-col justify-center px-6 sm:px-12 md:pl-20 lg:pl-28 pr-6 sm:pr-8 md:pr-10 py-12 sm:py-20 md:py-28">
            <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] mb-3">The House of</p>
            <h2 className="font-serif font-light text-[#1a1a1a] leading-tight mb-4 text-[22px] sm:text-[36px] md:text-[44px]">
              {content.siteInfo?.brandName ?? "Ahmed Elakad"}
            </h2>
            <div className="w-7 h-px bg-[#b3a384] mb-6" />
            <div className="space-y-3 text-[11px] sm:text-[13px] text-[#5a5a5a] leading-relaxed font-light">
              {bio.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
              {bio.length === 0 && <>
                <p>For over a decade, Ahmed Elakad Couture has been dedicated to creating bridal masterpieces that celebrate femininity, craftsmanship, and individuality.</p>
                <p>Each gown is meticulously handcrafted, combining couture techniques, intricate embellishments, and personalized fittings to ensure each bride experiences a dress made uniquely for her.</p>
              </>}
            </div>
            <Link href="/about" className="inline-flex items-center gap-2 mt-7 text-[8px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors">
              Discover Our Story
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* RIGHT: Image */}
          <div className="min-h-[220px] sm:min-h-[400px] md:min-h-[560px]">
            <img src={optimizeImage(houseImg)} alt="Ahmed Elakad craftsmanship" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>


      {/* ── COLLECTIONS ──────────────────────────────────────────── */}
      <section className="bg-[#f5f2ee] py-10 sm:py-16 md:py-20 px-4 sm:px-10 md:px-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] mb-3">Couture Collections</p>
            <h2 className="font-serif font-light text-[#1a1a1a] text-[26px] sm:text-[38px] md:text-[44px]">Discover Our Collections</h2>
          </div>
          {/* Always 3 columns exactly like the template */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {[
              { img: c1i, label: c1l, href: c1h },
              { img: c2i, label: c2l, href: c2h },
              { img: c3i, label: c3l, href: c3h },
            ].map((card) => (
              <Link key={card.label} href={card.href} className="relative block overflow-hidden group aspect-[3/4]">
                <img src={optimizeImage(card.img)} alt={card.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 md:p-6">
                  <p className="text-[6px] sm:text-[9px] tracking-[2px] sm:tracking-[3px] uppercase text-white font-medium mb-1 sm:mb-1.5">{card.label}</p>
                  <span className="inline-flex items-center gap-1 text-[5.5px] sm:text-[8px] tracking-[2px] uppercase text-white/65 group-hover:text-white transition-colors">
                    Explore <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ── REAL BRIDES ───────────────────────────────────────────── */}
      {brides.length > 0 && (
        <section className="bg-[#f5f2ee] py-10 sm:py-16 md:py-20">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-10 md:px-20">
            <div className="text-center mb-6 sm:mb-10">
              <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] mb-3">Real Brides</p>
              <h2 className="font-serif font-light text-[#1a1a1a] text-[24px] sm:text-[36px] md:text-[42px]">Real Moments. Real Love.</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2">
              {brides.map((img, i) => (
                <div key={i} className="aspect-[2/3] overflow-hidden">
                  <img src={optimizeImage(img)} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
            <div className="text-center mt-6 sm:mt-8">
              <Link href="/bridal" className="inline-flex items-center gap-2 text-[8px] tracking-[3px] uppercase text-[#1a1a1a] hover:text-[#b3a384] transition-colors border-b border-[#1a1a1a]/20 pb-1 hover:border-[#b3a384]">
                View More Real Brides <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </section>
      )}


      {/* ── BRIDAL JOURNEY ────────────────────────────────────────── */}
      <section className="relative bg-[#ece6db] overflow-hidden py-20 sm:py-28 md:py-36">
        {/* Left decorative image */}
        <div className="absolute left-0 top-0 bottom-0 w-[90px] sm:w-[200px] md:w-[320px] pointer-events-none select-none">
          <img src={optimizeImage(ctaImg)} alt="" className="w-full h-full object-cover opacity-35" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#ece6db]" />
        </div>
        {/* Centered content */}
        <div className="relative z-10 text-center px-6 max-w-sm sm:max-w-md mx-auto">
          <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] mb-3">Begin Your</p>
          <h2 className="font-serif font-light text-[#1a1a1a] leading-tight mb-4 text-[36px] sm:text-[48px] md:text-[54px]">{ctaHead}</h2>
          <div className="w-7 h-px bg-[#b3a384] mx-auto mb-6" />
          <p className="text-[12px] sm:text-[13px] text-[#6a6a6a] leading-relaxed font-light mb-9">{ctaDesc}</p>
          <Link href={ctaBtnHr} className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white text-[8px] tracking-[3px] uppercase px-8 sm:px-10 py-4 hover:bg-[#b3a384] transition-colors duration-300">
            {ctaBtn} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>

    </main>
  );
}
