/* eslint-disable @next/next/no-img-element */
import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";
import ContactForm from "@/components/ContactForm";


const waSvgPath = "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.8l-6.7-4-69.8 18.3L72 334.3l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.7 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z";

export default async function ContactPage() {
  const content = await getContent();
  const contact = content.contact ?? {};
  const phones: string[] = contact.phones ?? [];
  const heroImage = optimizeImage(contact.heroImage || "");
  const whatsappNumber = content.social?.whatsapp || "201101548030";
  const waHref = "https://wa.me/" + whatsappNumber.replace(/\D/g, "");

  const intlTitle = (contact as { internationalTitle?: string }).internationalTitle
    || "Worldwide Shipping Available";
  const intlText = (contact as { internationalText?: string }).internationalText
    || "Dreaming of an Ahmed Elakad gown from outside Egypt? We ship our bespoke creations to brides around the world. Whether you are in Europe, the Gulf, the Americas, or anywhere across the globe — we handle every detail of safe international delivery so your gown arrives in perfect condition, wherever your journey begins.";
  const intlImage = (contact as { internationalImage?: string }).internationalImage || "";

  return (
    <main className="bg-[#f9f7f4]">

      {/* ── Hero — same pattern as Bridal / Couture ── */}
      {heroImage ? (
        <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[70vh] overflow-hidden">
          <img
            src={heroImage}
            alt="Contact"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl uppercase tracking-[0.25em] text-white text-center drop-shadow-2xl">
              CONTACT
            </h1>
            <p className="text-[10px] sm:text-[11px] tracking-[5px] sm:tracking-[8px] uppercase text-white/70 font-medium">
              Get In Touch
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-24 sm:pt-32 md:pt-[180px] bg-[#f9f7f4]">
          <div className="py-12 sm:py-16 text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.2em] text-[#1a1a1a] leading-none mb-3">
              CONTACT
            </h1>
            <p className="text-[10px] tracking-[5px] uppercase text-[#aaa] font-medium">
              Get In Touch
            </p>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <section className="bg-[#f9f7f4]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 md:px-12 py-14 md:py-24">
          <div className="flex flex-col md:flex-row gap-12 md:gap-16 lg:gap-24">

            {/* Info */}
            <div className="md:w-[42%]">
              <h2 className="font-display text-2xl md:text-3xl uppercase tracking-[0.2em] text-[#1a1a1a] leading-tight mb-3">
                Make An Appointment
              </h2>
              <div className="w-12 h-px bg-[#b3a384] mb-6" />
              <p className="text-[#666] font-light text-sm leading-relaxed font-serif mb-10">
                {(contact as { pageSubtitle?: string }).pageSubtitle ||
                  "Get in touch with us to reserve an appointment, for more info or inquiries. We are thrilled to safely welcome you to our atelier and look forward to seeing you soon!"}
              </p>

              <div className="divide-y divide-[#e5e5e5]">
                {phones.length > 0 && (
                  <div className="py-5">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#b3a384] mb-2">Call Us</h3>
                    {phones.map((p, i) => (
                      <a key={i} href={"tel:" + p}
                        className="block text-[#555] text-sm font-light tracking-wide hover:text-[#b3a384] transition-colors">
                        {p}
                      </a>
                    ))}
                  </div>
                )}
                {contact.email && (
                  <div className="py-5">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#b3a384] mb-2">Email</h3>
                    <a href={"mailto:" + contact.email}
                      className="block text-[#555] text-sm font-light break-all hover:text-[#b3a384] transition-colors">
                      {contact.email}
                    </a>
                  </div>
                )}
                <div className="py-5">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#b3a384] mb-2">WhatsApp</h3>
                  <a href={waHref} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                    className="inline-flex w-10 h-10 rounded-full border border-[#d5d0c8] items-center justify-center text-[#999] hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
                    <svg width="18" height="18" viewBox="0 0 448 512" fill="currentColor">
                      <path d={waSvgPath} />
                    </svg>
                  </a>
                </div>
                {(contact as { location?: string }).location && (
                  <div className="py-5">
                    <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#b3a384] mb-2">Our Atelier</h3>
                    <p className="text-[#555] text-sm font-light leading-relaxed">
                      {(contact as { location?: string }).location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="md:flex-1 bg-white border border-[#eeeeee] px-6 sm:px-10 py-10 shadow-sm">
              <h2 className="font-display text-xl uppercase tracking-[0.2em] text-[#1a1a1a] mb-2">
                Send Us a Message
              </h2>
              <div className="w-8 h-px bg-[#b3a384] mb-8" />
              <ContactForm />
            </div>

          </div>
        </div>
      </section>

      {/* ── International Brides ── */}
      <section className="bg-[#0d0d0d] overflow-hidden">
        <div className="max-w-screen-xl mx-auto">
          <div className={`flex flex-col ${intlImage ? "md:flex-row" : ""}`}>

            {/* Text block */}
            <div className={`flex flex-col justify-center px-8 sm:px-14 md:px-16 lg:px-24 py-16 sm:py-20 md:py-24 ${intlImage ? "md:w-[52%]" : "w-full text-center items-center"}`}>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-6">
                {intlImage ? null : <div className="w-8 h-px bg-[#b3a384]" />}
                <span className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-medium">
                  International Brides
                </span>
                {intlImage ? null : <div className="w-8 h-px bg-[#b3a384]" />}
              </div>

              {/* Globe icon */}
              <div className="mb-6">
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#b3a384"
                  strokeWidth="1"
                  className={intlImage ? "" : "mx-auto"}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>

              <h2 className={`font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.18em] text-white leading-tight mb-5 ${!intlImage ? "max-w-[600px]" : ""}`}>
                {intlTitle}
              </h2>
              <div className={`w-12 h-px bg-[#b3a384] mb-6 ${!intlImage ? "mx-auto" : ""}`} />
              <p className={`text-white/55 text-[13px] sm:text-[14px] leading-[1.9] font-light font-serif mb-8 ${!intlImage ? "max-w-[560px]" : ""}`}>
                {intlText}
              </p>

              {/* Shipping badges */}
              <div className={`flex flex-wrap gap-3 mb-8 ${!intlImage ? "justify-center" : ""}`}>
                {["Europe", "Gulf & MENA", "Americas", "Asia Pacific", "Worldwide"].map((region) => (
                  <span
                    key={region}
                    className="text-[8px] tracking-[2px] uppercase text-white/40 border border-white/15 px-3 py-1.5"
                  >
                    {region}
                  </span>
                ))}
              </div>

              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-3 bg-[#b3a384] text-white text-[8px] tracking-[3px] uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors duration-300 w-fit ${!intlImage ? "self-center" : ""}`}
              >
                Enquire Now
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Optional image */}
            {intlImage && (
              <div className="md:w-[48%] min-h-[380px] md:min-h-0 overflow-hidden">
                <img
                  src={optimizeImage(intlImage)}
                  alt="International shipping"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

          </div>
        </div>
      </section>

    </main>
  );
}
