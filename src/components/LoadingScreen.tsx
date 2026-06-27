"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen({ heroSrc }: { heroSrc: string }) {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const triggerHide = () => {
      setFading(true);
      setTimeout(() => setGone(true), 700);
    };

    if (!heroSrc) { triggerHide(); return; }

    const img = new window.Image() as HTMLImageElement;
    img.src = heroSrc;

    // Already in browser cache
    if (img.complete && img.naturalHeight > 0) { triggerHide(); return; }

    img.addEventListener("load", triggerHide);
    img.addEventListener("error", triggerHide);
    // Never block longer than 5 seconds
    const fallback = setTimeout(triggerHide, 5000);

    return () => {
      img.removeEventListener("load", triggerHide);
      img.removeEventListener("error", triggerHide);
      clearTimeout(fallback);
    };
  }, [heroSrc]);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-[#0d0d0d] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <p className="font-display text-[11px] tracking-[7px] uppercase text-white/70 mb-2">
        Ahmed El Akad
      </p>
      <p className="text-[7px] tracking-[4px] uppercase text-[#b3a384]/60">
        Couture House
      </p>
    </div>
  );
}
