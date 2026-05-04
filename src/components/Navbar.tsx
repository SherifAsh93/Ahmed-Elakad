/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

export default function Navbar({ content }: { content: SiteContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Disable scroll when menu is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isOpen]);

  if (pathname.startsWith("/admin")) return null;

  const collections = content.collections ?? [];
  const bridalCollections = collections.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.slug.includes("bridal") || c.category === "bridal",
  );
  const labelCollections = collections.filter(
    (c: any) =>
      c.slug.includes("label") ||
      c.category === "label" ||
      c.slug === "evening",
  );

  return (
    <header className="w-full absolute top-0 left-0 z-50">
      {/* ── Row 1: Logo ────────────────────────── */}
      <div className="py-4 sm:py-6 bg-[#efe9e3]/80 backdrop-blur-md">
        <div className="container-custom flex justify-between items-center">
          <Link href="/" className="md:ml-12 lg:ml-20">
            <img
              src={optimizeImage(content.siteInfo?.logo ?? "https://res.cloudinary.com/dzppk5ylt/image/upload/v1777839570/main_logo_q0hdny.png")}
              alt={content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}
              className="h-[60px] md:h-[90px] w-auto object-contain transition-all"
            />
          </Link>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="block md:hidden p-2 text-[#b3a384] hover:text-[#1a1a1a] transition-colors focus:outline-none z-[60]"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Row 2: Desktop Links ───────────────── */}
      <nav className="hidden md:block bg-white border-b border-[#eee]">
        <ul className="flex justify-center items-center gap-14 text-[11px] tracking-[2.5px] text-[#a49a8b] h-14">
          <li>
            <Link
              href="/"
              className="nav-link font-sans uppercase h-full flex items-center"
            >
              HOME
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="nav-link font-sans uppercase h-full flex items-center"
            >
              THE DESIGNER
            </Link>
          </li>

          <li className="nav-item group relative h-full flex items-center">
            <div className="nav-link cursor-pointer flex items-center uppercase font-sans h-full">
              AHMED ELAKAD
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                className="ml-2 opacity-60"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dropdown-panel">
              {bridalCollections.map((col: any) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="dropdown-link"
                >
                  {col.title}
                </Link>
              ))}
            </div>
          </li>

          <li className="nav-item group relative h-full flex items-center">
            <div className="nav-link cursor-pointer flex items-center uppercase font-sans h-full">
              AHMED THE LABEL
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                className="ml-2 opacity-60"
              >
                <path
                  d="M1 1L5 5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="dropdown-panel">
              <Link
                href="/the-label"
                className="dropdown-link font-bold text-black border-b border-gray-50 pb-2 mb-2"
              >
                OFFICIAL PAGE
              </Link>
              {labelCollections.map((col: any) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="dropdown-link"
                >
                  {col.title.replace(/\s*\(THE LABEL\)\s*/i, "").trim()}
                </Link>
              ))}
            </div>
          </li>

          <li>
            <Link
              href="/contact"
              className="nav-link font-sans uppercase h-full flex items-center"
            >
              CONTACT US
            </Link>
          </li>
        </ul>
      </nav>

      {/* ── Mobile Sidebar ─────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/10 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-500 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-[100dvh] w-[85%] max-w-[400px] bg-white z-[50] md:hidden shadow-[-20px_0_60px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full text-center">
          {/* Menu Header */}
          <div className="p-8 flex justify-end items-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#b3a384] hover:text-black transition-colors p-2"
              aria-label="Close Menu"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-24 flex flex-col justify-around min-h-0">
            <div className="space-y-16">
              <Link
                href="/"
                className="block text-3xl tracking-[10px] text-[#1a1a1a] uppercase font-display hover:text-[#b3a384] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="block text-3xl tracking-[10px] text-[#1a1a1a] uppercase font-display hover:text-[#b3a384] transition-colors"
              >
                The Designer
              </Link>
            </div>

            <div className="space-y-12">
              <p className="text-[10px] tracking-[8px] text-[#b3a384] uppercase font-black opacity-40">
                Bridal Collections
              </p>
              <div className="flex flex-col space-y-10">
                {bridalCollections.map((col: any) => (
                  <Link
                    key={col.slug}
                    href={`/collections/${col.slug}`}
                    className="text-base tracking-[6px] text-[#555] uppercase hover:text-black transition-all hover:tracking-[8px]"
                  >
                    {col.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-12">
              <p className="text-[10px] tracking-[8px] text-[#b3a384] uppercase font-black opacity-40">
                The Label
              </p>
              <div className="flex flex-col space-y-10">
                <Link
                  href="/the-label"
                  className="text-base tracking-[6px] text-black font-bold uppercase hover:text-[#b3a384] transition-all"
                >
                  Official Page
                </Link>
                {labelCollections.map((col: any) => (
                  <Link
                    key={col.slug}
                    href={`/collections/${col.slug}`}
                    className="text-base tracking-[6px] text-[#555] uppercase hover:text-black transition-all hover:tracking-[8px]"
                  >
                    {col.title.replace(/\s*\(THE LABEL\)\s*/i, "").trim()}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/contact"
              className="block text-3xl tracking-[10px] text-[#1a1a1a] uppercase font-display hover:text-[#b3a384] transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Social Links at the bottom */}
          <div className="p-12 pb-16 border-t border-gray-50 bg-gray-50/20">
            <div className="flex justify-center items-center gap-12 mb-8">
              {/* WhatsApp */}
              <a href="https://wa.me/201101548030" target="_blank" rel="noreferrer" className="transition-all hover:scale-125 hover:text-[#25D366]">
                <svg width="22" height="22" viewBox="0 0 448 512" fill="currentColor" className="text-[#8a8174]">
                  <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 17.8 69.4 27.2 106.1 27.2 122.4 0 222-99.6 222-222 0-59.3-23-115.1-64.9-157.1zM223.9 446.3c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.4-29.4-28.1-63.3-28.1-98.2 0-101.7 82.8-184.5 184.5-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54 81.2 54 130.4 0 101.7-82.8 184.5-184.5 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.6-27.4-16.5-14.7-27.6-32.8-30.8-38.3-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.5-9.2 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.7z" />
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://web.facebook.com/ahmedelakadcouture" target="_blank" rel="noreferrer" className="transition-all hover:scale-125 hover:text-[#1877F2]">
                <svg width="22" height="22" viewBox="0 0 320 512" fill="currentColor" className="text-[#8a8174]">
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/ahmedelakad_/" target="_blank" rel="noreferrer" className="transition-all hover:scale-125 hover:text-[#E4405F]">
                <svg width="22" height="22" viewBox="0 0 448 512" fill="currentColor" className="text-[#8a8174]">
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6-29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
