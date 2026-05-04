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

  return (
    <header className="w-full absolute top-0 left-0 z-50">
      <div className="py-4 sm:py-6 bg-white border-b border-gray-100 shadow-sm">
        <div className="container-custom flex justify-between items-center">
          
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center">
            <img
              src={optimizeImage(content.siteInfo?.logo ?? "https://res.cloudinary.com/dzppk5ylt/image/upload/v1777839570/main_logo_q0hdny.png")}
              alt={content.siteInfo?.brandName ?? "Ahmed Elakad Couture"}
              className="h-[40px] md:h-[60px] w-auto object-contain transition-all"
            />
          </Link>

          {/* Desktop Nav (Right) */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-[11px] tracking-[3px] text-black uppercase hover:text-[#b3a384] transition-colors">Home</Link>
            <Link href="/about" className="text-[11px] tracking-[3px] text-black uppercase hover:text-[#b3a384] transition-colors">About Us</Link>
            <Link href="/bridal" className="text-[11px] tracking-[3px] text-black uppercase hover:text-[#b3a384] transition-colors">Bridal</Link>
            <Link href="/couture" className="text-[11px] tracking-[3px] text-black uppercase hover:text-[#b3a384] transition-colors">Couture</Link>
            <Link href="/contact" className="text-[11px] tracking-[3px] text-black uppercase hover:text-[#b3a384] transition-colors">Contact Us</Link>
          </nav>

          {/* Hamburger Menu Toggle (Mobile) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="block md:hidden p-2 text-black hover:text-[#b3a384] transition-colors focus:outline-none z-[60]"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`fixed top-0 left-0 w-full bg-white z-[50] md:hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="flex flex-col w-full">
          {/* Menu Header (Logo + Close) */}
          <div className="pt-6 pb-4 px-6 flex justify-between items-center">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center">
              <span className="font-display text-xl tracking-[4px] uppercase text-[#333]">
                Ahmed Elakad
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-black hover:text-gray-500 transition-colors focus:outline-none"
              aria-label="Close Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Menu Links */}
          <div className="flex flex-col pb-6 pt-2">
            <Link 
              href="/" 
              className="block w-full px-6 py-3.5 text-[11px] tracking-[2px] text-[#444] uppercase hover:bg-[#555] hover:text-white transition-colors text-left"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="block w-full px-6 py-3.5 text-[11px] tracking-[2px] text-[#444] uppercase hover:bg-[#555] hover:text-white transition-colors text-left"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link 
              href="/bridal" 
              className="block w-full px-6 py-3.5 text-[11px] tracking-[2px] text-[#444] uppercase hover:bg-[#555] hover:text-white transition-colors text-left"
              onClick={() => setIsOpen(false)}
            >
              Bridal
            </Link>
            <Link 
              href="/couture" 
              className="block w-full px-6 py-3.5 text-[11px] tracking-[2px] text-[#444] uppercase hover:bg-[#555] hover:text-white transition-colors text-left"
              onClick={() => setIsOpen(false)}
            >
              Couture
            </Link>
            <Link 
              href="/contact" 
              className="block w-full px-6 py-3.5 text-[11px] tracking-[2px] text-[#444] uppercase hover:bg-[#555] hover:text-white transition-colors text-left"
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      
      {/* Backdrop for top menu */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-500 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />
    </header>
  );
}
