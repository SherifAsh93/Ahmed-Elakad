/* eslint-disable @next/next/no-img-element */
import { getContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContactPage() {
  const content = await getContent();
  const contact = content.contact ?? {};
  const phones: string[] = contact.phones ?? [];
  const heroImage = optimizeImage(contact.heroImage || "/images/1 (200).jpg");
  const whatsappNumber = "201101548030";

  return (
    <main className="bg-white flex flex-col min-h-[calc(100vh-120px)] overflow-hidden">
      <div className="relative flex-1 w-full flex flex-col items-center justify-center gap-8 sm:gap-16 lg:gap-20 pt-28 sm:pt-36 lg:pt-40 pb-12 sm:pb-16 lg:pb-20 overflow-hidden bg-stone-100">
        {/* Background */}
        <img
          src={heroImage}
          alt="Contact Background"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 scale-105"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>

        {/* Title */}
        <div className="relative z-10 text-center px-4">
          <p className="text-[10px] tracking-[6px] sm:tracking-[8px] text-[#efe9e3] uppercase mb-3 font-bold opacity-90">
            Get in Touch
          </p>
          <h1 className="font-display text-4xl sm:text-6xl md:text-8xl text-white uppercase tracking-[0.15em] sm:tracking-[0.25em] leading-[1.1] mb-4 sm:mb-6">
            Contact
          </h1>
          <div className="h-px w-16 sm:w-24 bg-[#efe9e3]/40 mx-auto"></div>
        </div>

        {/* Contact Cards */}
        <div className="relative z-10 w-full container-custom max-w-6xl mx-auto mb-4 sm:mb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
            
            {/* Studio */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-sm pt-8 sm:pt-12 lg:pt-20 pb-8 sm:pb-10 lg:pb-14 px-4 sm:px-6 lg:px-14 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-8 lg:mb-10 flex items-center justify-center rounded-full bg-[#b3a384]/20 border border-[#b3a384]/30 text-[#efe9e3]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-[#b3a384] text-[9px] sm:text-[10px] font-black uppercase tracking-[3px] sm:tracking-[5px] mb-2 sm:mb-4">
                Studio
              </h3>
              <p className="text-white text-sm sm:text-base lg:text-lg font-light tracking-wide">
                {contact.location}
              </p>
            </div>

            {/* Phone */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-sm pt-8 sm:pt-12 lg:pt-20 pb-8 sm:pb-10 lg:pb-14 px-4 sm:px-6 lg:px-14 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-8 lg:mb-10 flex items-center justify-center rounded-full bg-[#b3a384]/20 border border-[#b3a384]/30 text-[#efe9e3]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 18.92Z" />
                </svg>
              </div>
              <h3 className="text-[#b3a384] text-[9px] sm:text-[10px] font-black uppercase tracking-[3px] sm:tracking-[5px] mb-2 sm:mb-4">
                Contact
              </h3>
              <div className="flex flex-col gap-1">
                {phones.map((p, i) => (
                  <a key={i} href={`tel:${p}`} className="text-white text-sm sm:text-base lg:text-lg font-light hover:text-[#b3a384] transition-colors decoration-transparent">
                    {p}
                  </a>
                ))}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-sm pt-8 sm:pt-12 lg:pt-20 pb-8 sm:pb-10 lg:pb-14 px-4 sm:px-6 lg:px-14 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-8 lg:mb-10 flex items-center justify-center rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3 className="text-[#b3a384] text-[9px] sm:text-[10px] font-black uppercase tracking-[3px] sm:tracking-[5px] mb-4 sm:mb-6 lg:mb-8">
                WhatsApp
              </h3>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#075E54] text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-full text-[9px] sm:text-[10px] uppercase tracking-[2px] sm:tracking-[3px] font-bold hover:bg-[#128C7E] transition-all shadow-lg"
              >
                Direct Chat
              </a>
            </div>

            {/* Email */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-sm pt-8 sm:pt-12 lg:pt-20 pb-8 sm:pb-10 lg:pb-14 px-4 sm:px-6 lg:px-14 flex flex-col items-center text-center transition-all duration-500 hover:bg-white/10 hover:-translate-y-1 sm:hover:-translate-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-8 lg:mb-10 flex items-center justify-center rounded-full bg-[#b3a384]/20 border border-[#b3a384]/30 text-[#efe9e3]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h3 className="text-[#b3a384] text-[9px] sm:text-[10px] font-black uppercase tracking-[3px] sm:tracking-[5px] mb-2 sm:mb-4">
                Email
              </h3>
              <a
                href={`mailto:${contact.email}`}
                className="text-white text-xs sm:text-sm lg:text-base font-light hover:text-[#b3a384] transition-all break-all decoration-transparent"
              >
                {contact.email}
              </a>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
