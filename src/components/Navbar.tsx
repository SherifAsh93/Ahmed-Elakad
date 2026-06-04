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

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (pathname.startsWith("/admin")) return null;

  const transparent = isHome && !isScrolled && !isOpen;
  const brand = content.siteInfo?.brandName ?? "Ahmed El Akad";

  const navLinks = [
    { href: "/bridal",     label: "Bridal"     },
    { href: "/couture",    label: "Couture"    },
    { href: "/about",      label: "About"      },
    { href: "/experience", label: "Experience" },
    { href: "/contact",    label: "Contact"    },
  ];

  return (
    <>
      <header className={`w-full fixed top-0 left-0 z-50 transition-all duration-500 ${
        transparent ? "bg-transparent" : "bg-[#0d0d0d]/95 backdrop-blur-sm"
      }`}>
        <div className="flex items-center justify-between h-[60px] sm:h-[68px] px-5 sm:px-10 md:px-16 max-w-[1440px] mx-auto">

          {/* Brand */}
          <Link href="/" onClick={handleLogoClick} className="flex flex-col leading-none gap-[3px]">
            <span className="font-display text-[10px] sm:text-[11px] tracking-[3px] uppercase text-white">
              {brand.toUpperCase()}
            </span>
            <span className="text-[7px] tracking-[2.5px] uppercase text-white/45">
              Couture House
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8">
            {navLinks.map((l) => (
              <Link
                key={`${l.href}-${l.label}`}
                href={l.href}
                className="text-[8.5px] lg:text-[9px] tracking-[2px] uppercase text-white/70 hover:text-white transition-colors font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop book btn */}
          <Link
            href="/contact"
            className="hidden md:inline-flex items-center px-5 py-2 text-[7.5px] tracking-[2px] uppercase border border-white/35 text-white hover:bg-white hover:text-black transition-all duration-300 whitespace-nowrap"
          >
            Book Appointment
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 shrink-0"
            aria-label="Toggle menu"
          >
            <span className={`block h-px bg-white transition-all duration-300 ${isOpen ? "w-6 rotate-45 translate-y-[7px]" : "w-6"}`} />
            <span className={`block h-px bg-white transition-all duration-300 ${isOpen ? "opacity-0 w-0" : "w-5"}`} />
            <span className={`block h-px bg-white transition-all duration-300 ${isOpen ? "w-6 -rotate-45 -translate-y-[7px]" : "w-6"}`} />
          </button>
        </div>
      </header>

      {/* Full-screen mobile menu overlay */}
      <div className={`fixed inset-0 z-40 md:hidden flex flex-col transition-all duration-500 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
        style={{ backgroundColor: "#f5f2ee" }}
      >
        {/* Close button area — same height as navbar */}
        <div className="h-[60px] sm:h-[68px] flex items-center px-5 sm:px-10">
          <Link href="/" onClick={handleLogoClick} className="flex flex-col leading-none gap-[3px]">
            <span className="font-display text-[10px] tracking-[3px] uppercase text-[#1a1a1a]">
              {brand.toUpperCase()}
            </span>
            <span className="text-[7px] tracking-[2.5px] uppercase text-[#aaa]">
              Couture House
            </span>
          </Link>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#e0dbd3] mx-5" />

        {/* Nav links — centered, vertical */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
          {navLinks.map((l) => (
            <Link
              key={`mob-${l.href}-${l.label}`}
              href={l.href}
              onClick={() => setIsOpen(false)}
              className="block py-3 text-[11px] tracking-[4px] uppercase text-[#777] hover:text-[#1a1a1a] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="h-px w-12 bg-[#e0dbd3] my-4" />
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="px-10 py-3.5 border border-[#b3a384] text-[9px] tracking-[3px] uppercase text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
          >
            Book Appointment
          </Link>
        </nav>

        {/* Bottom branding */}
        <div className="pb-10 text-center">
          <p className="text-[8px] tracking-[3px] uppercase text-[#bbb]">
            © {new Date().getFullYear()} Ahmed Elakad Couture House
          </p>
        </div>
      </div>
    </>
  );
}
