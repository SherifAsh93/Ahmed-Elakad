"use client";

import { useState, useEffect } from "react";

interface GalleryImage {
  src: string;
}

export default function MasonryGallery({
  images,
}: {
  images: GalleryImage[] | string[];
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [visible, setVisible] = useState(48);
  const [colCount, setColCount] = useState(4);

  const srcs = images.map((img) => (typeof img === "string" ? img : img.src));

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setColCount(2);
      else if (w < 1024) setColCount(3);
      else setColCount(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const openLightbox = (src: string) => {
    const idx = srcs.indexOf(src);
    setLightboxIdx(idx);
    setLightbox(src);
  };

  const closeLightbox = () => setLightbox(null);

  const gotoPrev = (currentIdx: number) => {
    const idx = (currentIdx - 1 + srcs.length) % srcs.length;
    setLightboxIdx(idx);
    setLightbox(srcs[idx]);
  };

  const gotoNext = (currentIdx: number) => {
    const idx = (currentIdx + 1) % srcs.length;
    setLightboxIdx(idx);
    setLightbox(srcs[idx]);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") gotoPrev(lightboxIdx);
      if (e.key === "ArrowRight") gotoNext(lightboxIdx);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, lightboxIdx]);

  const displayed = srcs.slice(0, visible);

  const columns: string[][] = Array.from({ length: colCount }, () => []);
  displayed.forEach((src, i) => {
    columns[i % colCount].push(src);
  });

  const gap = colCount === 2 ? "8px" : "12px";

  return (
    <>
      {/* Masonry Grid */}
      <div style={{ display: "flex", gap, alignItems: "flex-start" }}>
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap }}
          >
            {col.map((src, i) => (
              <div
                key={src + i}
                onClick={() => openLightbox(src)}
                style={{ overflow: "hidden", cursor: "zoom-in", lineHeight: 0 }}
                className="group"
              >
                <img
                  src={src}
                  alt={`Collection piece ${colIdx + i * colCount + 1}`}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", display: "block" }}
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Load More */}
      {visible < srcs.length && (
        <div className="text-center mt-16">
          <button
            onClick={() => setVisible((v) => v + 48)}
            className="btn-gold"
          >
            Load More
          </button>
          <p className="text-[#888] text-xs mt-4 tracking-wide">
            Showing {visible} of {srcs.length} pieces
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-xl sm:text-2xl hover:text-[#b8965a] transition-colors z-10 cursor-pointer w-10 h-10 flex items-center justify-center"
          >
            ✕
          </button>

          {/* Prev */}
          <button
            onClick={() => gotoPrev(lightboxIdx)}
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 text-white text-4xl sm:text-5xl hover:text-[#b8965a] transition-colors z-10 p-2 sm:p-4 cursor-pointer"
          >
            ‹
          </button>

          {/* Image */}
          <img
            src={lightbox}
            alt="Collection piece"
            className="lightbox-img"
            style={{
              maxWidth: "92vw",
              maxHeight: "88vh",
              objectFit: "contain",
            }}
          />

          {/* Next */}
          <button
            onClick={() => gotoNext(lightboxIdx)}
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 text-white text-4xl sm:text-5xl hover:text-[#b8965a] transition-colors z-10 p-2 sm:p-4 cursor-pointer"
          >
            ›
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-[2px]">
            {lightboxIdx + 1} / {srcs.length}
          </div>
        </div>
      )}
    </>
  );
}
