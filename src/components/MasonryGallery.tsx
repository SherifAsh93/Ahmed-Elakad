'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface GalleryImage { src: string; }

export default function MasonryGallery({ images }: { images: GalleryImage[] | string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [visible, setVisible] = useState(48);

  const srcs = images.map(img => (typeof img === 'string' ? img : img.src));

  const openLightbox = (src: string) => {
    const idx = srcs.indexOf(src);
    setLightboxIdx(idx);
    setLightbox(src);
  };

  const closeLightbox = () => setLightbox(null);

  const prev = useCallback(() => {
    const idx = (lightboxIdx - 1 + srcs.length) % srcs.length;
    setLightboxIdx(idx);
    setLightbox(srcs[idx]);
  }, [lightboxIdx, srcs]);

  const next = useCallback(() => {
    const idx = (lightboxIdx + 1) % srcs.length;
    setLightboxIdx(idx);
    setLightbox(srcs[idx]);
  }, [lightboxIdx, srcs]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, prev, next]);

  const displayed = srcs.slice(0, visible);

  return (
    <>
      <div className="masonry-grid">
        {displayed.map((src, i) => (
          <div key={src + i} className="masonry-item cursor-zoom-in" onClick={() => openLightbox(src)}>
            <img
              src={src}
              alt={`Collection piece ${i + 1}`}
              loading="lazy"
              className="w-full block"
            />
          </div>
        ))}
      </div>

      {visible < srcs.length && (
        <div className="text-center mt-16">
          <button
            onClick={() => setVisible(v => v + 48)}
            className="btn-gold">
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
          onClick={e => { if (e.target === e.currentTarget) closeLightbox(); }}>
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white text-2xl hover:text-[#b8965a] transition-colors z-10 cursor-pointer">
            ✕
          </button>
          {/* Prev */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-[#b8965a] transition-colors z-10 p-4 cursor-pointer">
            ‹
          </button>
          {/* Image */}
          <img
            src={lightbox}
            alt="Collection piece"
            className="lightbox-img"
          />
          {/* Next */}
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-[#b8965a] transition-colors z-10 p-4 cursor-pointer">
            ›
          </button>
          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-[2px]">
            {lightboxIdx + 1} / {srcs.length}
          </div>
        </div>
      )}
    </>
  );
}
