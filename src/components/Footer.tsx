"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteContent } from "@/lib/content";

export default function Footer({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const contact = content.contact ?? {};
  const phone = (contact.phones && contact.phones.length > 0) ? contact.phones[0] : "";
  const email = contact.email || "";

  return (
    <footer className="w-full bg-[#0d0d0d] text-white py-7">
      <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-12 lg:px-20">

        {/* Accent line */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#b3a384] to-transparent mb-6" />

        {/* Main row: nav | contact icons | social */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-5">

          {/* Nav links */}
          <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 text-[11px] tracking-[3px] uppercase font-medium">
            <Link href="/about" className="text-white hover:text-[#b3a384] transition-colors duration-300">About Us</Link>
            <Link href="/bridal" className="text-white hover:text-[#b3a384] transition-colors duration-300">Bridal</Link>
            <Link href="/couture" className="text-white hover:text-[#b3a384] transition-colors duration-300">Couture</Link>
            <Link href="/contact" className="text-white hover:text-[#b3a384] transition-colors duration-300">Contact Us</Link>
          </div>

          {/* Contact icons */}
          <div className="flex items-center gap-4">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" aria-label="Call us"
                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} aria-label="Email us"
                className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>
            )}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a href={content.social?.facebook || "#"} target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
              <svg width="12" height="12" viewBox="0 0 320 512" fill="currentColor">
                <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
              </svg>
            </a>
            <a href={((content.social as { instagram?: string })?.instagram) || "#"} target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
              <svg width="12" height="12" viewBox="0 0 448 512" fill="currentColor">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
              </svg>
            </a>
            <a href={content.social?.whatsapp || "#"} target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white hover:border-[#b3a384] hover:text-[#b3a384] transition-all duration-300">
              <svg width="12" height="12" viewBox="0 0 448 512" fill="currentColor">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.8l-6.7-4-69.8 18.3L72 334.3l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.7 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
            </a>
          </div>

        </div>

        {/* Copyright */}
        <div className="w-full h-[0.5px] bg-white/10 mb-4" />
        <p className="text-[10px] tracking-[2px] uppercase text-white/50 text-center">
          © {new Date().getFullYear()} Ahmed Elakad. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
