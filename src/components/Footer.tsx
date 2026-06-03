"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SiteContent } from "@/lib/content";

export default function Footer({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const contact = content.contact ?? {};
  const phone = (contact.phones && contact.phones.length > 0) ? contact.phones[0] : "";
  const email = contact.email || "";
  const social = content.social ?? {};
  const instagram = (social as { instagram?: string }).instagram || "#";

  const exploreLinks = [
    { href: "/bridal", label: "Collections" },
    { href: "/about", label: "Atelier" },
    { href: "/bridal", label: "Brides" },
    { href: "/couture", label: "Experience" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="w-full bg-[#0d0d0d] text-white">
      <div className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 md:px-20 pt-16 pb-8">

        {/* Brand center */}
        <div className="flex flex-col items-center gap-2 mb-12">
          <span className="font-display text-[28px] sm:text-[36px] tracking-[10px] uppercase text-white">
            Ahmed Elakad
          </span>
          <span className="text-[9px] tracking-[5px] uppercase text-[#b3a384] font-medium">
            Couture Atelier
          </span>
          <div className="w-8 h-[1px] bg-[#b3a384] mt-2" />
        </div>

        {/* Divider */}
        <div className="w-full h-[0.5px] bg-white/10 mb-12" />

        {/* Three columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 mb-14">

          {/* Explore */}
          <div className="flex flex-col items-start sm:items-center">
            <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] font-bold mb-6">
              Explore
            </p>
            <ul className="space-y-3 sm:text-center">
              {exploreLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-white/50 hover:text-white transition-colors leading-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Atelier */}
          <div className="flex flex-col items-start sm:items-center">
            <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] font-bold mb-6">
              Atelier
            </p>
            <div className="space-y-4 sm:text-center">
              <div className="flex items-start sm:justify-center gap-3">
                <svg className="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-[12px] text-white/50 leading-snug">Cairo, Egypt</span>
              </div>
              {phone && (
                <div className="flex items-center sm:justify-center gap-3">
                  <svg className="shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-[12px] text-white/50 hover:text-white transition-colors">{phone}</a>
                </div>
              )}
              {email && (
                <div className="flex items-center sm:justify-center gap-3">
                  <svg className="shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <a href={`mailto:${email}`} className="text-[12px] text-white/50 hover:text-white transition-colors">{email}</a>
                </div>
              )}
              <p className="text-[8px] tracking-[3px] uppercase text-white/25 pt-1">
                By Appointment Only
              </p>
            </div>
          </div>

          {/* Follow */}
          <div className="flex flex-col items-start sm:items-center">
            <p className="text-[8px] tracking-[4px] uppercase text-[#b3a384] font-bold mb-6">
              Follow
            </p>
            <div className="space-y-4 sm:text-center">
              <a href={instagram} target="_blank" rel="noreferrer" className="flex items-center sm:justify-center gap-3 group">
                <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors">
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>
                <span className="text-[12px] text-white/50 group-hover:text-white transition-colors">Instagram</span>
              </a>
              <a href={social.facebook || "#"} target="_blank" rel="noreferrer" className="flex items-center sm:justify-center gap-3 group">
                <svg width="14" height="14" viewBox="0 0 320 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
                <span className="text-[12px] text-white/50 group-hover:text-white transition-colors">Facebook</span>
              </a>
              {social.whatsapp && (
                <a href={social.whatsapp} target="_blank" rel="noreferrer" className="flex items-center sm:justify-center gap-3 group">
                  <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" className="text-white/30 group-hover:text-white transition-colors">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157z" />
                  </svg>
                  <span className="text-[12px] text-white/50 group-hover:text-white transition-colors">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom divider + copyright */}
        <div className="w-full h-[0.5px] bg-white/10 mb-6" />
        <p className="text-[9px] tracking-[2px] uppercase text-white/25 text-center">
          © {new Date().getFullYear()} Ahmed Elakad Couture Atelier. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
