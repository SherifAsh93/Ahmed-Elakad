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

function ArrowBtn({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm border border-black/10 text-[#1a1a1a] shadow-md hover:bg-white hover:scale-105 transition-all duration-150 ${
        dir === "left" ? "left-2" : "right-2"
      }`}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === "left"
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
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
  const scrolledRef = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const hasMultiple = coll.images.length > 1;
  const label = coll.name || `Design ${idx + 1}`;

  // Check overflow on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtEnd(el.scrollWidth <= el.clientWidth + 5);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    scrolledRef.current = true;
    setAtStart(el.scrollLeft <= 5);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
    setCurrentIdx(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const scrollTo = (dir: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      className="group text-left"
      onPointerDown={() => { scrolledRef.current = false; }}
    >
      {/* Card image area */}
      <div className="relative aspect-[3/4] bg-[#f0ede8] mb-5 overflow-hidden">
        {/* Scrollable image strip — same free-scroll style as Real Moments */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={() => { if (!scrolledRef.current) onOpen(); }}
          className="flex h-full overflow-x-auto cursor-pointer"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {coll.images.map((src, i) => (
            <div key={i} className="flex-none h-full" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizeImage(src)}
                alt={`${label} ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 pointer-events-none" />

        {/* Navigation arrows */}
        {hasMultiple && !atStart && (
          <ArrowBtn dir="left" onClick={(e) => scrollTo(-1, e)} />
        )}
        {hasMultiple && !atEnd && (
          <ArrowBtn dir="right" onClick={(e) => scrollTo(1, e)} />
        )}

        {/* Image count indicator */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {coll.images.length <= 8 ? (
              coll.images.map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] rounded-full transition-all duration-300 ${
                    i === currentIdx ? "w-4 bg-white" : "w-[3px] bg-white/50"
                  }`}
                />
              ))
            ) : (
              <span className="text-[9px] text-white/80 font-medium tracking-wider bg-black/25 backdrop-blur-[2px] rounded-full px-2 py-0.5">
                {currentIdx + 1} / {coll.images.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Collection name — also opens modal */}
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
