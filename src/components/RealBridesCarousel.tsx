"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { optimizeImage } from "@/lib/utils";

export default function RealBridesCarousel({ images }: { images: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtEnd(el.scrollWidth <= el.clientWidth + 5);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 5);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll ~3 images at a time
    const imgW = el.clientWidth / 6;
    el.scrollBy({ left: dir * imgW * 3, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="flex-none aspect-[2/3] overflow-hidden"
            style={{ width: "calc((100vw - 2.5rem) / 6)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimizeImage(img)}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Left arrow */}
      {!atStart && (
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm border border-black/10 text-[#1a1a1a] shadow-md hover:bg-white hover:scale-105 transition-all duration-150 z-10"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {!atEnd && (
        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm border border-black/10 text-[#1a1a1a] shadow-md hover:bg-white hover:scale-105 transition-all duration-150 z-10"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
