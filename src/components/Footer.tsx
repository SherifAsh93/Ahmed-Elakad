"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SiteContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

export default function Footer({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const contact = content.contact ?? {};
  const phone = (contact.phones && contact.phones.length > 0) ? contact.phones[0] : "";
  const email = contact.email || "";
  const social = content.social ?? {};
  const instagram = (social as { instagram?: string }).instagram || "#";
  const whatsapp = (social as { whatsapp?: string }).whatsapp || "";
  const logoSrc = content.siteInfo?.logo ?? "";
  const brandName = content.siteInfo?.brandName ?? "Ahmed Elakad";

  const colHead = "text-[7px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-4 sm:mb-5";
  const colLink = "text-[10px] sm:text-[11px] text-white/45 hover:text-white transition-colors leading-none";

  return (
    <footer className="w-full bg-[#0d0d0d] text-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-10 md:px-16 pt-10 sm:pt-14 pb-6">

        {/* ── Main grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 md:grid-cols-[1.4fr_1fr_1.2fr_1.2fr] gap-x-3 sm:gap-x-8 gap-y-8 mb-8 sm:mb-10">

          {/* Col 1 — Brand / Logo */}
          <div className="col-span-3 md:col-span-1 flex flex-col items-center md:items-start gap-2 pb-4 md:pb-0 border-b border-white/8 md:border-none">
            {logoSrc ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                <img src={optimizeImage(logoSrc)} alt="Ahmed El Akad" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center">
                <span className="font-display text-white/60 text-lg">A</span>
              </div>
            )}
            <div className="text-center md:text-left mt-1">
              <p className="font-display text-[10px] sm:text-[11px] tracking-[3px] uppercase text-white">{brandName}</p>
              <p className="text-[7px] tracking-[2.5px] uppercase text-white/40 mt-0.5">Couture House</p>
            </div>
          </div>

          {/* Col 2 — Atelier */}
          <div className="col-span-1">
            <p className={colHead}>Atelier</p>
            <div className="space-y-2.5">
              <p className="text-[10px] sm:text-[11px] text-white/45 leading-snug">Cairo, Egypt</p>
            </div>
          </div>

          {/* Col 3 — Follow */}
          <div className="col-span-1">
            <p className={colHead}>Follow</p>
            <div className="space-y-3">
              {/* Instagram */}
              <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <svg width="11" height="11" viewBox="0 0 448 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                </svg>
                <span className={colLink}>Instagram</span>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/ahmedelakadcouture" target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className={colLink}>Facebook</span>
              </a>
              {/* Threads */}
              <a href="https://www.threads.com/@ahmedelakad_?igshid=NTc4MTIwNjQ2YQ==" target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.86 1.902-4.16 2.727-7.277 2.65z"/>
                </svg>
                <span className={colLink}>Threads</span>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@ahmedelakadcouture?_r=1&_t=ZS-96ujy5ez56L" target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                <span className={colLink}>TikTok</span>
              </a>
            </div>
          </div>

          {/* Col 4 — Contact Us */}
          <div className="col-span-1">
            <p className={colHead}>Contact Us</p>
            <div className="space-y-3">
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 group">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span className={colLink}>Email</span>
                </a>
              )}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                  <svg width="11" height="11" viewBox="0 0 448 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z"/>
                  </svg>
                  <span className={colLink}>WhatsApp</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 group">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span className={colLink}>Phone</span>
                </a>
              )}
            </div>
          </div>

        </div>

        {/* ── Divider + copyright ───────────────────────────────── */}
        <div className="w-full h-[0.5px] bg-white/10 mb-4" />
        <p className="text-[8px] tracking-[2px] uppercase text-white/25 text-center">
          © {new Date().getFullYear()} Ahmed Elakad Couture House. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
