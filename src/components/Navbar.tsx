/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteContent } from "@/lib/content";

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
      <div className="py-6 bg-[#efe9e3]/80 backdrop-blur-md">
        <div className="container-custom flex justify-between items-center">
          <Link href="/" className="md:ml-12 lg:ml-20">
            <img
              src={content.siteInfo?.logo ?? "/logo.png"}
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
                  {col.title}
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

      {/* ── Mobile Overlay ─────────────────────── */}
      <div
        className={`fixed inset-0 bg-white/98 z-50 md:hidden transition-all duration-500 ease-in-out ${isOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-4"}`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-8 p-12 overflow-y-auto">
          <Link
            href="/"
            className="text-xl tracking-[5px] text-[#1a1a1a] uppercase font-display border-b border-[#b3a384]/20 pb-2"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-xl tracking-[5px] text-[#1a1a1a] uppercase font-display border-b border-[#b3a384]/20 pb-2"
          >
            The Designer
          </Link>

          <div className="text-center">
            <p className="text-[10px] tracking-[4px] text-[#b3a384] uppercase font-bold mb-4">
              Bridal Collections
            </p>
            <div className="flex flex-col space-y-3">
              {bridalCollections.map((col: any) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="text-sm tracking-[3px] text-[#7d7d7d] uppercase hover:text-black"
                >
                  {col.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] tracking-[4px] text-[#b3a384] uppercase font-bold mb-4">
              The Label
            </p>
            <div className="flex flex-col space-y-3">
              <Link
                href="/the-label"
                className="text-sm tracking-[3px] text-black font-bold uppercase"
              >
                Official Page
              </Link>
              {labelCollections.map((col: any) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="text-sm tracking-[3px] text-[#7d7d7d] uppercase hover:text-black"
                >
                  {col.title}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/contact"
            className="text-xl tracking-[5px] text-[#1a1a1a] uppercase font-display border-b border-[#b3a384]/20 pb-2"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </header>
  );
}
