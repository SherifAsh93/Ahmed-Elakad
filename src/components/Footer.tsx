"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteContent } from "@/lib/content";
import { optimizeImage } from "@/lib/utils";

export default function Footer({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="w-full bg-[#efe9e3]/60 border-t border-[#efe9e3] pt-20 pb-16">
      <div className="container-custom max-w-6xl mx-auto px-6 flex flex-col items-center">
        
        {/* Row 1: Centered Logo */}
        <div className="mb-16">
          <Link href="/">
            <img 
              src={optimizeImage(content.siteInfo?.logo ?? "https://res.cloudinary.com/dzppk5ylt/image/upload/v1777839570/main_logo_q0hdny.png")} 
              alt={content.siteInfo?.brandName ?? "Ahmed Elakad Couture"} 
              className="h-[100px] w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Row 2: Bottom Details */}
        <div className="w-full border-t border-[#8a8174]/10 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] tracking-[3px] text-[#8a8174] font-bold uppercase">
          
          <div className="text-center md:text-left space-y-2">
            <p className="opacity-80">Copyright © {new Date().getFullYear()} {content.footer?.copyright ?? "Ahmed Elakad. All Rights Reserved."}</p>
            <p>
              <a href={content.footer?.creditLink ?? "#"} target="_blank" rel="noreferrer" className="hover:text-black transition-colors opacity-80 hover:opacity-100">
                  {content.footer?.creditText ?? "Designed and Developed by Web Corner"}
              </a>
            </p>
          </div>

          <div className="flex items-center gap-7 mt-8 md:mt-0">
            {/* WhatsApp */}
            <a href="https://wa.me/201101548030" target="_blank" rel="noreferrer" className="transition-all hover:scale-110 opacity-80 hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 448 512" fill="#8a8174">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.7 17.8 69.4 27.2 106.1 27.2 122.4 0 222-99.6 222-222 0-59.3-23-115.1-64.9-157.1zM223.9 446.3c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.7-68.1-4.4-7c-18.4-29.4-28.1-63.3-28.1-98.2 0-101.7 82.8-184.5 184.5-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 54 81.2 54 130.4 0 101.7-82.8 184.5-184.5 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.6-27.4-16.5-14.7-27.6-32.8-30.8-38.3-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.5-9.2 1.9-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.7z" />
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://web.facebook.com/ahmedelakadcouture" target="_blank" rel="noreferrer" className="transition-all hover:scale-110 opacity-80 hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 320 512" fill="#8a8174">
                <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://www.instagram.com/ahmedelakad_/" target="_blank" rel="noreferrer" className="transition-all hover:scale-110 opacity-80 hover:opacity-100">
              <svg width="14" height="14" viewBox="0 0 448 512" fill="#8a8174">
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
