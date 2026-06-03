"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SiteContent } from "@/lib/content";

export default function Navbar({ content }: { content: SiteContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logoTaps = useRef(0);
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHome = pathname === "/";

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

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const transparent = isHome && !isScrolled;

  const navLinks = [
    { href: "/bridal", label: "Collections" },
    { href: "/about", label: "Atelier" },
    { href: "/bridal", label: "Brides" },
    { href: "/couture", label: "Experience" },
    { href: "/about", label: "Journal" },
    { href: "/contact", label: "Contact" },
  ];

  const brandName = content.siteInfo?.brandName ?? "Ahmed El Akad";

  return (
    <header className={`w-full fixed top-0 left-0 z-50 transition-all duration-500 ${
      transparent
        ? "bg-transparent"
        : "bg-[#0d0d0d]/96 backdrop-blur-sm border-b border-white/5"
    }`}>
      <div className="flex justify-between items-center h-[72px] px-6 sm:px-10 md:px-16 max-w-[1440px] mx-auto">

        {/* Logo — text-based brand mark */}
        <Link href="/" onClick={handleLogoClick} className="flex flex-col items-start leading-none gap-0.5 min-w-[120px]">
          <span className="font-display text-[11px] tracking-[3px] uppercase text-white">
            {brandName.toUpperCase()}
          </span>
          <span className="text-[7.5px] tracking-[2.5px] uppercase text-white/50">
            COUTURE ATELIER
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8">
          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="text-[8.5px] lg:text-[9.5px] tracking-[2px] lg:tracking-[2.5px] uppercase text-white/75 hover:text-white transition-colors duration-200 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Book Appointment + Hamburger */}
        <div className="flex items-center gap-3 min-w-[100px] justify-end">
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center px-4 lg:px-5 py-2.5 text-[7.5px] lg:text-[8.5px] tracking-[2px] uppercase border border-white/35 text-white hover:bg-white hover:text-black transition-all duration-300 whitespace-nowrap"
          >
            Book Appointment
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white transition-colors md:hidden"
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

      {/* Mobile Menu */}
      <div
        className={`absolute top-full left-0 w-full bg-[#0d0d0d] md:hidden transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] origin-top overflow-hidden ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col py-8 items-center text-center gap-1 border-t border-white/10">
          {navLinks.map((link) => (
            <Link
              key={`mob-${link.href}-${link.label}`}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block w-full px-6 py-4 text-[10px] tracking-[3px] uppercase text-white/65 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="mt-4 px-8 py-3 border border-white/30 text-[9px] tracking-[2.5px] uppercase text-white hover:bg-white hover:text-black transition-all"
          >
            Book Appointment
          </Link>
        </nav>
      </div>

      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-[-1] md:hidden transition-opacity duration-400 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
    </header>
  );
}
