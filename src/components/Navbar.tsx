/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/bridal", label: "Bridal" },
  { href: "/couture", label: "Couture" },
  { href: "/contact", label: "Contact Us" },
];

export default function Navbar({ content }: { content: SiteContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="w-full absolute top-0 left-0 z-50">
      {/* Top bar */}
      <div className="relative z-[60] bg-white border-b border-gray-50 shadow-sm">
        <div className="flex justify-between items-center h-[80px] px-12 sm:px-24 max-w-[1440px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full py-2">
            <img
              src={optimizeImage(content.siteInfo?.logo ?? "")}
              alt={content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}
              className="h-[56px] sm:h-[60px] md:h-[64px] w-auto object-contain block"
            />
          </Link>

          {/* Desktop Nav - Centered */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] tracking-[3px] uppercase transition-colors ${pathname === link.href
                  ? "text-[#b3a384] font-medium"
                  : "text-[#1a1a1a] hover:text-[#b3a384]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Toggle / Hamburger (Right side) */}
          <div className="flex justify-end min-w-[100px] md:min-w-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-[#1a1a1a] hover:text-[#b3a384] transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown — fits content only, not full-screen */}
      <div
        className={`absolute top-full left-0 w-full bg-white z-[55] md:hidden transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top overflow-hidden ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <nav className="flex flex-col py-8 items-center text-center">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block w-full px-6 py-4 text-[15px] tracking-[3px] uppercase transition-colors ${isActive
                  ? "text-[#b3a384] font-medium"
                  : "text-[#1a1a1a] hover:text-[#b3a384]"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Backdrop — click to close */}
      <div
        className={`fixed inset-0 z-[50] md:hidden transition-opacity duration-400 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsOpen(false)}
      />
    </header>
  );
}
