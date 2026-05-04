import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

export default async function AboutPage() {
  const content = await getContent();
  const about = content.about ?? {};
  const bio: string[] = about.bio ?? [];

  const firstParagraph =
    bio.length > 0
      ? bio[0]
      : "Ahmed Elakad Couture is a luxury fashion house specializing in bridal and couture wear.";
  const remainingBio = bio.length > 1 ? bio.slice(1) : [];

  return (
    <div className="bg-[#f9f7f4] min-h-screen flex flex-col">
      {/* ── Full-screen hero: image AS background, card ON TOP ── */}
      <section
        className="relative w-full min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('${optimizeImage(
            about.portraitImage ??
              "https://res.cloudinary.com/dzppk5ylt/image/upload/v1776524416/1_105_obr7j0.jpg"
          )}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* White card centered on the background image */}
        <div className="relative z-10 w-[88%] sm:w-[75%] max-w-[600px] bg-white/93 backdrop-blur-sm px-6 py-10 sm:px-14 sm:py-14 md:px-16 md:py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] my-28 sm:my-32">
          <p className="font-serif italic text-sm sm:text-base text-[#b3a384] mb-3 sm:mb-4 tracking-wide">
            {about.subtitle ?? "Ahmed Elakad"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#1a1a1a] uppercase tracking-[0.25em] sm:tracking-[0.3em] leading-tight mb-6 sm:mb-8">
            About
            <br />
            Us
          </h1>
          <p className="text-[#555] leading-[1.9] sm:leading-[2.1] text-sm sm:text-[15px] font-light max-w-[460px] mx-auto font-serif">
            {firstParagraph}
          </p>
        </div>
      </section>

      {/* ── Bio Section ── */}
      {remainingBio.length > 0 && (
        <section className="w-full py-20 sm:py-28 px-5 sm:px-6">
          <div className="max-w-[680px] mx-auto space-y-8 sm:space-y-10 text-center">
            {remainingBio.map((para, i) => (
              <p
                key={i}
                className="text-[#333] leading-[2] sm:leading-[2.2] text-base sm:text-lg font-light font-serif"
              >
                {para}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
