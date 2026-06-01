"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SiteContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

export default function Navbar({ content }: { content: SiteContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logoTaps = useRef(0);
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleLogoClick(e: React.MouseEvent) {
    logoTaps.current += 1;
    if (logoTimer.current) clearTimeout(logoTimer.current);
    if (logoTaps.current >= 3) {
      e.preventDefault();
      logoTaps.current = 0;
      router.push("/admin");
      return;
    }
    logoTimer.current = setTimeout(() => { logoTaps.current = 0; }, 600);
  }

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const isBridalActive = pathname === "/bridal" || pathname.startsWith("/bridal/");
  const isCoutureActive = pathname === "/couture" || pathname.startsWith("/couture/");

  const navLinks = [
    { href: "/", label: "Home", isActive: pathname === "/" },
    { href: "/bridal", label: "Bridal", isActive: isBridalActive },
    { href: "/couture", label: "Couture", isActive: isCoutureActive },
    { href: "/about", label: "About Us", isActive: pathname === "/about" },
    { href: "/contact", label: "Contact Us", isActive: pathname === "/contact" },
  ];

  return (
    <header className="w-full absolute top-0 left-0 z-50">
      {/* Top bar */}
      <div className="relative z-[60] bg-white border-b border-gray-50 shadow-sm">
        <div className="flex justify-between items-center h-[72px] px-6 sm:px-10 md:px-20 max-w-[1440px] mx-auto">
          {/* Logo */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center h-full py-1">
            <img
              src={optimizeImage(content.siteInfo?.logo ?? "")}
              alt={content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}
              className="h-[58px] w-auto object-contain block"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[12px] tracking-[2px] uppercase transition-colors ${
                  link.isActive ? "text-[#b3a384] font-medium" : "text-[#1a1a1a] hover:text-[#b3a384]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Hamburger */}
          <div className="flex justify-end min-w-[100px] md:hidden">
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

      {/* Mobile Menu */}
      <div
        className={`absolute top-full left-0 w-full bg-white z-[55] md:hidden transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top overflow-hidden ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col py-8 items-center text-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block w-full px-6 py-4 text-[13px] tracking-[2px] uppercase transition-colors ${
                link.isActive ? "text-[#b3a384] font-medium" : "text-[#1a1a1a] hover:text-[#b3a384]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-[50] md:hidden transition-opacity duration-400 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
    </header>
  );
}
