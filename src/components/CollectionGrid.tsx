"use client";

import { useState, useEffect } from "react";
import MasonryGallery from "./MasonryGallery";
import { optimizeImage } from "@/lib/utils";

interface Collection {
  id: string;
  name?: string;
  images: string[];
}

// Returns grid + optional centering wrapper classes based on collection count
function adaptiveGrid(count: number): { grid: string; wrap: string } {
  if (count === 1) return { grid: "grid-cols-1", wrap: "max-w-[340px] mx-auto" };
  if (count === 2) return { grid: "grid-cols-2", wrap: "max-w-2xl mx-auto" };
  if (count === 3) return { grid: "grid-cols-2 sm:grid-cols-3", wrap: "" };
  if (count === 4) return { grid: "grid-cols-2 lg:grid-cols-4", wrap: "" };
  return { grid: "grid-cols-2 lg:grid-cols-3", wrap: "" };
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
          {filled.map((coll, idx) => {
            const cover = optimizeImage(coll.images[0]);
            const label = coll.name || `Design ${idx + 1}`;
            return (
              <button
                key={coll.id}
                onClick={() => setOpen(coll)}
                className="group text-left focus:outline-none"
              >
                {/* Portrait image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f0ede8] mb-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt={label}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />

                  {coll.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold tracking-[2px] px-2.5 py-1 rounded-full">
                      {coll.images.length}
                    </div>
                  )}
                </div>

                {coll.name && (
                  <h2 className="font-display text-[11px] sm:text-sm md:text-base uppercase tracking-[0.1em] text-[#1a1a1a] text-center transition-colors group-hover:text-[#b3a384] leading-snug">
                    {coll.name}
                  </h2>
                )}
              </button>
            );
          })}
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
