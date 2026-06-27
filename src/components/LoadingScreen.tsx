"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const triggerHide = () => {
      setFading(true);
      setTimeout(() => setGone(true), 700);
    };

    // window.load fires only when ALL resources (images, fonts, scripts) are fully loaded
    if (document.readyState === "complete") {
      triggerHide();
      return;
    }

    window.addEventListener("load", triggerHide);
    // Safety fallback — never block longer than 10 seconds
    const fallback = setTimeout(triggerHide, 10000);

    return () => {
      window.removeEventListener("load", triggerHide);
      clearTimeout(fallback);
    };
  }, []);

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
