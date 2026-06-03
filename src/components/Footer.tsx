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
  const logoSrc = content.siteInfo?.logo ?? "";
  const instaPhotos = (content.homepage?.featuredImages ?? []).slice(0, 4);

  const quickLinks = [
    { href: "/bridal", label: "Collections" },
    { href: "/about", label: "Atelier" },
    { href: "/bridal", label: "Brides" },
    { href: "/couture", label: "Experience" },
    { href: "/about", label: "Journal" },
    { href: "/contact", label: "Contact" },
  ];

  const colHead = "text-[7px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-4 sm:mb-5";
  const colLink = "text-[10px] sm:text-[11px] text-white/45 hover:text-white transition-colors leading-none";

  return (
    <footer className="w-full bg-[#0d0d0d] text-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-10 md:px-16 pt-10 sm:pt-14 pb-6">

        {/* ── Main grid ─────────────────────────────────────────── */}
        {/* Mobile: 2 rows — [brand | quick-links | atelier] + [follow | instagram]
            Desktop: single row of 5 columns */}
        <div className="grid grid-cols-3 md:grid-cols-[1.4fr_1fr_1.3fr_1fr_1.1fr] gap-x-4 sm:gap-x-8 gap-y-10 mb-8 sm:mb-10">

          {/* Col 1 — Brand / Logo */}
          <div className="col-span-3 md:col-span-1 flex flex-col items-center md:items-start gap-2 pb-4 md:pb-0 border-b border-white/8 md:border-none">
            {logoSrc && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                <img
                  src={optimizeImage(logoSrc)}
                  alt="Ahmed El Akad"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            {!logoSrc && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center">
                <span className="font-display text-white/60 text-lg">A</span>
              </div>
            )}
            <div className="text-center md:text-left mt-1">
              <p className="font-display text-[10px] sm:text-[11px] tracking-[3px] uppercase text-white">
                Ahmed El Akad
              </p>
              <p className="text-[7px] tracking-[2.5px] uppercase text-white/40 mt-0.5">
                Couture Atelier
              </p>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div className="col-span-1">
            <p className={colHead}>Quick Links</p>
            <ul className="space-y-2.5 sm:space-y-3">
              {quickLinks.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <Link href={l.href} className={colLink}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Atelier */}
          <div className="col-span-1">
            <p className={colHead}>Atelier</p>
            <div className="space-y-2.5 sm:space-y-3">
              <p className="text-[9px] sm:text-[10px] text-white/45 leading-snug">Cairo, Egypt</p>
              <p className="text-[7px] sm:text-[8px] tracking-[2px] uppercase text-white/25">
                By Appointment Only
              </p>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, "")}`} className={`block ${colLink}`}>
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className={`block text-[8px] sm:text-[10px] text-white/45 hover:text-white transition-colors break-all`}>
                  {email}
                </a>
              )}
            </div>
          </div>

          {/* Col 4 — Follow */}
          <div className="col-span-1">
            <p className={colHead}>Follow</p>
            <div className="space-y-3">
              <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                <svg width="11" height="11" viewBox="0 0 448 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>
                <span className={colLink}>Instagram</span>
              </a>
              {social.whatsapp && (
                <a href={social.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 group">
                  <svg width="11" height="11" viewBox="0 0 448 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z" />
                  </svg>
                  <span className={colLink}>WhatsApp</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 group">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-white transition-colors shrink-0">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span className={colLink}>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Col 5 — @AHMEDELAKAD Instagram grid */}
          {instaPhotos.length > 0 && (
            <div className="col-span-3 md:col-span-1">
              <a href={instagram} target="_blank" rel="noreferrer">
                <p className={`${colHead} hover:text-white transition-colors cursor-pointer`}>@ahmedelakad</p>
              </a>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-1">
                {instaPhotos.map((img, i) => (
                  <a key={i} href={instagram} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden block">
                    <img
                      src={optimizeImage(img)}
                      alt=""
                      className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-300"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Divider + copyright ───────────────────────────────── */}
        <div className="w-full h-[0.5px] bg-white/10 mb-4" />
        <p className="text-[8px] tracking-[2px] uppercase text-white/25 text-center">
          © {new Date().getFullYear()} Ahmed Elakad Couture Atelier. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
