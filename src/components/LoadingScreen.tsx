"use client";

import { useEffect, useState } from "react";

// Blank dark overlay — same color as the body background (#0d0d0d).
// Fades out once window.load fires (all images, fonts, and scripts are ready).
// No new text or UI elements — the page just stays dark until fully loaded.
export default function LoadingScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const triggerHide = () => {
      setFading(true);
      setTimeout(() => setGone(true), 600);
    };

    if (document.readyState === "complete") {
      triggerHide();
      return;
    }

    window.addEventListener("load", triggerHide);
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
      className={`fixed inset-0 z-[9999] bg-[#0d0d0d] pointer-events-none transition-opacity duration-600 ${fading ? "opacity-0" : "opacity-100"}`}
    />
  );
}
