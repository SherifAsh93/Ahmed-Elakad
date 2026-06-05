"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/content";

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center gap-[5px] mt-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < count ? "#b3a384" : "none"}
          stroke="#b3a384" strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="bg-[#f5f0ea] px-6 sm:px-8 py-8 sm:py-10 flex flex-col h-full">
      <div className="font-serif text-[36px] sm:text-[40px] text-[#b3a384] leading-none mb-5 select-none">&ldquo;</div>
      <p className="text-[#4a4a4a] text-[14px] sm:text-[15px] leading-[1.9] font-light font-serif flex-1 text-center" dir="auto">{t.quote}</p>
      <div className="w-12 h-px bg-[#c4b59a] mx-auto my-6" />
      <p className="text-[10px] sm:text-[11px] tracking-[3px] uppercase text-[#2a2218] font-medium text-center" dir="auto">— {t.name}</p>
      {t.subtitle && <p className="text-[9px] sm:text-[10px] tracking-[2px] uppercase text-[#aaa] mt-1.5 text-center" dir="auto">{t.subtitle}</p>}
      <Stars count={t.rating ?? 5} />
    </div>
  );
}

export default function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [open, setOpen] = useState(false);

  if (testimonials.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-[#d5cfc5]">
        <p className="text-[10px] tracking-[4px] uppercase text-[#bbb]">No testimonials yet</p>
      </div>
    );
  }

  return (
    <>
      {/* 3 cards — horizontal scroll on mobile */}
      <div className="-mx-5 sm:-mx-10 px-5 sm:px-10 flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-8 sm:mb-10">
        {testimonials.slice(0, 3).map((t) => (
          <div key={t.id} className="flex-none w-[76vw] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] snap-start">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>

      {/* VIEW MORE REVIEWS */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center px-10 sm:px-14 py-3.5 border border-[#b3a384]/70 text-[8px] tracking-[4px] uppercase text-[#b3a384] hover:bg-[#b3a384] hover:text-white transition-all duration-300"
        >
          View More Reviews
        </button>
      </div>

      {/* MODAL — all testimonials */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#f9f7f4] rounded-sm shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-[#f9f7f4] z-10 px-6 sm:px-10 py-6 border-b border-[#e8e3dc] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-px bg-[#b3a384]" />
                  <span className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-medium">Client Love</span>
                  <div className="w-8 h-px bg-[#b3a384]" />
                </div>
                <h2 className="font-display text-[20px] sm:text-[26px] uppercase tracking-[0.25em] text-[#1a1a1a]">
                  Kind Words
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-[#999] hover:text-[#1a1a1a] transition-colors text-xl font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            {/* All cards grid */}
            <div className="p-6 sm:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {testimonials.map((t) => (
                  <TestimonialCard key={t.id} t={t} />
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
