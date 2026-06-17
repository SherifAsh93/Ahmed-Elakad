"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MasonryGallery from "./MasonryGallery";
import { optimizeImage } from "@/lib/utils";

interface Collection {
  id: string;
  name?: string;
  images: string[];
}

function adaptiveGrid(count: number): { grid: string; wrap: string } {
  if (count === 1) return { grid: "grid-cols-1", wrap: "max-w-[340px] mx-auto" };
  if (count === 2) return { grid: "grid-cols-2", wrap: "max-w-2xl mx-auto" };
  if (count === 3) return { grid: "grid-cols-2 sm:grid-cols-3", wrap: "" };
  if (count === 4) return { grid: "grid-cols-2 lg:grid-cols-4", wrap: "" };
  return { grid: "grid-cols-2 lg:grid-cols-3", wrap: "" };
}

function CollectionCard({
  coll,
  idx,
  onOpen,
}: {
  coll: Collection;
  idx: number;
  onOpen: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const hasMultiple = coll.images.length > 1;
  const label = coll.name || `Design ${idx + 1}`;
  const isAtEnd = currentIdx >= coll.images.length - 1;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCurrentIdx(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const handleCarouselPointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  };

  const handleCarouselClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Math.abs(e.clientX - pointerStartX.current) > 8) return;
    onOpen();
  };

  return (
    <div className="group text-left">
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ede8] mb-5">
        {/* Scrollable carousel */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={handleCarouselPointerDown}
          onClick={handleCarouselClick}
          className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-none cursor-pointer"
        >
          {coll.images.map((src, i) => (
            <div key={i} className="flex-shrink-0 w-full h-full snap-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizeImage(src)}
                alt={`${label} ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 pointer-events-none" />

        {/* Arrow scroll indicator — grayscale/faint at rest, bright on hover */}
        {hasMultiple && !isAtEnd && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-35 group-hover:opacity-90 transition-opacity duration-300">
            <div className="animate-nudge-x bg-black/30 backdrop-blur-[2px] rounded-full p-1.5 text-white grayscale group-hover:grayscale-0 transition-all duration-300">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        )}

        {/* Dot indicators (≤8 images) or counter (>8) */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {coll.images.length <= 8 ? (
              coll.images.map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] rounded-full transition-all duration-300 ${
                    i === currentIdx ? "w-4 bg-white" : "w-[3px] bg-white/45"
                  }`}
                />
              ))
            ) : (
              <span className="text-[9px] text-white/70 font-medium tracking-wider bg-black/25 backdrop-blur-[2px] rounded-full px-2 py-0.5">
                {currentIdx + 1} / {coll.images.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Collection name */}
      {coll.name && (
        <h2
          onClick={onOpen}
          className="font-display text-[11px] sm:text-sm md:text-base uppercase tracking-[0.1em] text-[#1a1a1a] text-center transition-colors group-hover:text-[#b3a384] leading-snug cursor-pointer"
        >
          {coll.name}
        </h2>
      )}
    </div>
  );
}

export default function CollectionGrid({
  collections,
}: {
  collections: Collection[];
}) {
  const [open, setOpen] = useState<Collection | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const filled = collections.filter((c) => c.images.length > 0);

  if (filled.length === 0) {
    return (
      <div className="flex items-center justify-center py-28 text-center">
        <div>
          <p className="font-display text-2xl sm:text-3xl uppercase tracking-[0.15em] text-[#b3a384] mb-3">
            Coming Soon
          </p>
          <p className="text-[10px] tracking-[4px] text-[#bbb] uppercase font-bold">
            Collection in progress
          </p>
        </div>
      </div>
    );
  }

  const { grid, wrap } = adaptiveGrid(filled.length);

  return (
    <>
      <div className={wrap}>
        <div className={`grid ${grid} gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-14`}>
          {filled.map((coll, idx) => (
            <CollectionCard
              key={coll.id}
              coll={coll}
              idx={idx}
              onOpen={() => setOpen(coll)}
            />
          ))}
        </div>
      </div>

      {/* Full-screen gallery modal */}
      {open && (
        <div
          className="fixed inset-0 z-[300] bg-black/96 overflow-y-auto overscroll-contain"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <div>
              {open.name && (
                <p className="text-white font-display text-sm uppercase tracking-[3px]">{open.name}</p>
              )}
              <p className="text-white/50 text-[10px] uppercase tracking-[3px] font-bold mt-0.5">
                {open.images.length} {open.images.length === 1 ? "Image" : "Images"}
              </p>
            </div>
            <button
              onClick={() => setOpen(null)}
              className="text-white/70 hover:text-white transition-colors p-2 -mr-2 text-2xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-3 sm:px-8 md:px-12 py-6 max-w-screen-xl mx-auto">
            <MasonryGallery images={open.images} />
          </div>
        </div>
      )}
    </>
  );
}
