/* eslint-disable @next/next/no-img-element */
import { getContent, Testimonial, VideoItem } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return url;
  return null;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function VideoCard({ video }: { video: VideoItem }) {
  const embedUrl = getEmbedUrl(video.url);
  if (!embedUrl) return null;
  return (
    <div className="flex flex-col">
      <div className="aspect-video bg-[#1a1a1a] overflow-hidden">
        {isDirectVideo(video.url) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={embedUrl} controls playsInline className="w-full h-full object-cover" />
        ) : (
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
            loading="lazy"
            title={video.title || video.clientName || "Client video"}
          />
        )}
      </div>
      {(video.clientName || video.title) && (
        <div className="pt-4 px-1">
          {video.clientName && (
            <p className="text-[9px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-1">{video.clientName}</p>
          )}
          {video.clientSubtitle && (
            <p className="text-[9px] tracking-[2px] uppercase text-[#aaa]">{video.clientSubtitle}</p>
          )}
          {video.title && !video.clientName && (
            <p className="text-[11px] text-[#555] font-light">{video.title}</p>
          )}
        </div>
      )}
    </div>
  );
}


function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="bg-[#f5f0ea] px-6 sm:px-8 py-8 sm:py-10 flex flex-col h-full">
      <div className="font-serif text-[36px] sm:text-[40px] text-[#b3a384] leading-none mb-5 select-none">&ldquo;</div>
      <p className="text-[#4a4a4a] text-[14px] sm:text-[15px] leading-[1.9] font-light font-serif flex-1 text-center" dir="auto">{t.quote}</p>
      <div className="w-12 h-px bg-[#c4b59a] mx-auto my-6" />
      <p className="text-[10px] sm:text-[11px] tracking-[3px] uppercase text-[#2a2218] font-medium text-center" dir="auto">— {t.name}</p>
      {t.subtitle && <p className="text-[9px] sm:text-[10px] tracking-[2px] uppercase text-[#aaa] mt-1.5 text-center" dir="auto">{t.subtitle}</p>}
      <div className="flex items-center justify-center gap-[5px] mt-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24"
            fill={i < (t.rating ?? 5) ? "#b3a384" : "none"}
            stroke="#b3a384" strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    </div>
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
  const videos: VideoItem[] = (exp.videos ?? []).filter((v) => getEmbedUrl(v.url));

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
            src={optimizeImage(heroImage)}
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
          <img src={optimizeImage(heroImage)} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
          {testimonials.length > 0 ? (
            <>
              <div className="-mx-5 sm:-mx-10 px-5 sm:px-10 flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-8 sm:mb-10">
                {testimonials.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex-none w-[76vw] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] snap-start">
                    <TestimonialCard t={t} />
                  </div>
                ))}
              </div>

              {/* VIEW MORE REVIEWS */}
              <div className="flex justify-center mt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-10 sm:px-14 py-3.5 border border-[#b3a384]/70 text-[8px] tracking-[4px] uppercase text-[#b3a384] hover:bg-[#b3a384] hover:text-white transition-all duration-300"
                >
                  View More Reviews
                </Link>
              </div>
            </>
          ) : (
            <div className="py-16 text-center border border-dashed border-[#d5cfc5]">
              <p className="text-[10px] tracking-[4px] uppercase text-[#bbb]">No testimonials yet</p>
            </div>
          )}

        </div>
      </section>


      {/* ── CLIENT VIDEOS ── */}
      {videos.length > 0 && (
        <section className="bg-[#f5f2ee] py-16 sm:py-24 px-5 sm:px-10 border-t border-[#ece8e2]">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] mb-3">In Their Own Words</p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.25em] text-[#1a1a1a] mb-4">
                {exp.videoSectionTitle || "CLIENT STORIES"}
              </h2>
              {exp.videoSectionSubtitle && (
                <p className="text-[#666] text-sm font-light font-serif mt-2 max-w-[440px] mx-auto">{exp.videoSectionSubtitle}</p>
              )}
              <div className="w-12 h-px bg-[#b3a384]/40 mx-auto mt-5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ── YOUR STORY CTA — single unified layout matching template ── */}
      <section className="relative w-full min-h-[40vh] flex items-center overflow-hidden">
        {ctaImage ? (
          <img src={optimizeImage(ctaImage)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
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
