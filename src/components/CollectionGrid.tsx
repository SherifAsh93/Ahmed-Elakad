"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MasonryGallery from "./MasonryGallery";
import { optimizeImage } from "@/lib/utils";

interface Collection {
  id: string;
  name?: string;
  images: string[];
}

export interface CollectionGridProps {
  collections: Collection[];
  section?: "bridal" | "couture";
  year?: string;
}

// Module-level cache so all grids on the "All" page share one auth request
let adminAuthPromise: Promise<boolean> | null = null;
function getAdminStatus(): Promise<boolean> {
  if (!adminAuthPromise) {
    adminAuthPromise = fetch("/api/auth")
      .then((r) => r.ok)
      .catch(() => false);
  }
  return adminAuthPromise;
}

// ── Adaptive grid layout ─────────────────────────────
function adaptiveGrid(count: number): { grid: string; wrap: string } {
  if (count === 1) return { grid: "grid-cols-1", wrap: "max-w-[340px] mx-auto" };
  if (count === 2) return { grid: "grid-cols-2", wrap: "max-w-2xl mx-auto" };
  if (count === 3) return { grid: "grid-cols-2 sm:grid-cols-3", wrap: "" };
  if (count === 4) return { grid: "grid-cols-2 lg:grid-cols-4", wrap: "" };
  return { grid: "grid-cols-2 lg:grid-cols-3", wrap: "" };
}

// ── Arrow nav button ─────────────────────────────────
function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm border border-black/10 text-[#1a1a1a] shadow-md hover:bg-white hover:scale-105 transition-all duration-150 ${dir === "left" ? "left-2" : "right-2"}`}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

// ── Edit-mode card (puzzle piece) ───────────────────
function EditCard({
  coll,
  idx,
  isSelected,
  hasSelection,
  onTap,
}: {
  coll: Collection;
  idx: number;
  isSelected: boolean;
  hasSelection: boolean;
  onTap: () => void;
}) {
  const label = coll.name || `Design ${idx + 1}`;

  return (
    <div
      onClick={onTap}
      className={`relative cursor-pointer select-none transition-all duration-200 ${
        isSelected
          ? "scale-[0.94] z-10"
          : hasSelection
          ? "hover:scale-[0.97]"
          : "hover:scale-[0.98]"
      }`}
    >
      <div
        className={`relative aspect-[3/4] overflow-hidden rounded-sm transition-all duration-200 ${
          isSelected
            ? "ring-[3px] ring-[#b3a384] ring-offset-4 shadow-2xl"
            : hasSelection
            ? "ring-2 ring-dashed ring-[#b3a384]/60 hover:ring-[#b3a384] hover:ring-solid"
            : "ring-1 ring-black/10 hover:ring-[#b3a384]/40"
        }`}
      >
        <img
          src={optimizeImage(coll.images[0])}
          alt={label}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Overlay */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
            isSelected
              ? "bg-black/55"
              : hasSelection
              ? "bg-black/30 hover:bg-black/40"
              : "bg-black/20 hover:bg-black/30"
          }`}
        >
          {isSelected ? (
            <>
              <div className="w-9 h-9 rounded-full bg-[#b3a384] flex items-center justify-center text-white text-lg font-light">
                ✦
              </div>
              <p className="text-white text-[8px] tracking-[2px] uppercase font-bold text-center px-4 leading-relaxed">
                Now tap any other card to swap
              </p>
              <p className="text-white/60 text-[7px] tracking-[1.5px] uppercase text-center">
                or tap this again to cancel
              </p>
            </>
          ) : hasSelection ? (
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full border-2 border-white/60 border-dashed flex items-center justify-center text-white text-base">
                ↓
              </div>
              <p className="text-white/80 text-[7px] tracking-[2px] uppercase font-medium">
                Swap here
              </p>
            </div>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center rounded bg-black/50 text-white/80 shadow">
              {/* Grip dots */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="8.5" cy="7" r="1.8" /><circle cx="15.5" cy="7" r="1.8" />
                <circle cx="8.5" cy="12" r="1.8" /><circle cx="15.5" cy="12" r="1.8" />
                <circle cx="8.5" cy="17" r="1.8" /><circle cx="15.5" cy="17" r="1.8" />
              </svg>
            </div>
          )}
        </div>

        {/* Position badge */}
        <div
          className={`absolute top-2 left-2 w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center shadow ${
            isSelected ? "bg-[#b3a384] text-white" : "bg-black/55 text-white"
          }`}
        >
          {idx + 1}
        </div>

        {/* Selected indicator — count badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#b3a384] text-white text-[7px] tracking-[1.5px] uppercase font-bold rounded">
            Selected
          </div>
        )}
      </div>

      {coll.name && (
        <h2
          className={`mt-3 font-display text-[11px] sm:text-sm uppercase tracking-[0.1em] text-center leading-snug transition-colors ${
            isSelected ? "text-[#b3a384]" : "text-[#aaa]"
          }`}
        >
          {coll.name}
        </h2>
      )}
    </div>
  );
}

// ── View-mode card (browse images, click to open gallery) ──
function ViewCard({ coll, idx, onOpen }: { coll: Collection; idx: number; onOpen: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const hasMultiple = coll.images.length > 1;
  const label = coll.name || `Design ${idx + 1}`;

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
    scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      className="group text-left relative"
      onPointerDown={() => { scrolledRef.current = false; }}
    >
      <div className="relative aspect-[3/4] bg-[#f0ede8] mb-5 overflow-hidden">
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

        <div className="absolute inset-0 transition-all duration-500 pointer-events-none bg-black/0 group-hover:bg-black/10" />

        {hasMultiple && !atStart && <ArrowBtn dir="left" onClick={(e) => scrollTo(-1, e)} />}
        {hasMultiple && !atEnd && <ArrowBtn dir="right" onClick={(e) => scrollTo(1, e)} />}

        {hasMultiple && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {coll.images.length <= 8 ? (
              coll.images.map((_, i) => (
                <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i === currentIdx ? "w-4 bg-white" : "w-[3px] bg-white/50"}`} />
              ))
            ) : (
              <span className="text-[9px] text-white/80 font-medium tracking-wider bg-black/25 backdrop-blur-[2px] rounded-full px-2 py-0.5">
                {currentIdx + 1} / {coll.images.length}
              </span>
            )}
          </div>
        )}
      </div>

      {coll.name && (
        <h2
          onClick={onOpen}
          className="font-display text-[11px] sm:text-sm md:text-base uppercase tracking-[0.1em] text-center leading-snug text-[#1a1a1a] cursor-pointer group-hover:text-[#b3a384] transition-colors"
        >
          {coll.name}
        </h2>
      )}
    </div>
  );
}

// ── Main CollectionGrid ──────────────────────────────
export default function CollectionGrid({ collections, section, year }: CollectionGridProps) {
  const filled = collections.filter((c) => c.images.length > 0);

  const [open, setOpen] = useState<Collection | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // items only used in edit mode — initialized from filled when entering edit mode
  const [items, setItems] = useState<Collection[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Single shared auth check (module-level cache)
  useEffect(() => {
    if (!section || !year) return;
    getAdminStatus().then((ok) => { if (ok) setIsAdmin(true); });
  }, [section, year]);

  // Gallery keyboard close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  // Body scroll lock for gallery
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function enterEdit() {
    setItems([...filled]); // snapshot current visible order
    setSelectedIdx(null);
    setEditMode(true);
  }

  function exitEdit() {
    setSelectedIdx(null);
    setEditMode(false);
  }

  async function handleCardTap(idx: number) {
    if (selectedIdx === null) {
      // Pick up this card
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      // Tap same card → deselect (put back)
      setSelectedIdx(null);
    } else {
      // Swap selected card with tapped card
      const next = [...items];
      [next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]];
      setItems(next);
      setSelectedIdx(null);
      // Auto-save immediately
      setSaving(true);
      try {
        await fetch("/api/admin/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, year, collections: next }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
      }
    }
  }

  if (filled.length === 0) {
    return (
      <div className="flex items-center justify-center py-28 text-center">
        <div>
          <p className="font-display text-2xl sm:text-3xl uppercase tracking-[0.15em] text-[#b3a384] mb-3">Coming Soon</p>
          <p className="text-[10px] tracking-[4px] text-[#bbb] uppercase font-bold">Collection in progress</p>
        </div>
      </div>
    );
  }

  const displayItems = editMode ? items : filled;
  const { grid, wrap } = adaptiveGrid(displayItems.length);

  return (
    <>
      {/* Admin controls bar */}
      {isAdmin && (
        <div className="mb-5 flex items-center justify-between gap-3 min-h-[36px]">
          <div className="flex items-center gap-2">
            {editMode && saving && (
              <span className="text-[9px] text-[#aaa] tracking-[2px] uppercase">Saving…</span>
            )}
            {editMode && saved && !saving && (
              <span className="text-[9px] text-green-600 tracking-[2px] uppercase font-bold animate-pulse">
                ✓ Saved
              </span>
            )}
            {editMode && !saving && !saved && selectedIdx !== null && (
              <span className="text-[9px] text-[#b3a384] tracking-[2px] uppercase font-medium">
                Now tap another card to swap
              </span>
            )}
            {editMode && !saving && !saved && selectedIdx === null && (
              <span className="text-[9px] text-[#b3a384] tracking-[2px] uppercase font-medium">
                Tap a card to pick it up
              </span>
            )}
          </div>
          <button
            onClick={editMode ? exitEdit : enterEdit}
            className={`shrink-0 px-4 py-2 text-[8px] tracking-[2px] uppercase font-bold transition-all rounded-sm border ${
              editMode
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-black"
                : "bg-white text-[#555] border-[#ccc] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
            }`}
          >
            {editMode ? "✕ Done" : "⠿ Reorder"}
          </button>
        </div>
      )}

      <div className={wrap}>
        <div className={`grid ${grid} gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-14`}>
          {displayItems.map((coll, idx) =>
            editMode ? (
              <EditCard
                key={coll.id}
                coll={coll}
                idx={idx}
                isSelected={selectedIdx === idx}
                hasSelection={selectedIdx !== null}
                onTap={() => handleCardTap(idx)}
              />
            ) : (
              <ViewCard
                key={coll.id}
                coll={coll}
                idx={idx}
                onOpen={() => setOpen(coll)}
              />
            )
          )}
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
