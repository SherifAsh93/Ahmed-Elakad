"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MasonryGallery from "./MasonryGallery";
import { optimizeImage } from "@/lib/utils";

interface Collection {
  id: string;
  name?: string;
  images: string[];
  coverIndex?: number;
}

function coverImg(coll: Collection): string {
  return coll.images[coll.coverIndex ?? 0] ?? coll.images[0];
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

// ── Arrow nav button — transparent, animated ─────────
function ArrowBtn({ dir, onClick }: { dir: "left" | "right"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center ${dir === "left" ? "left-1" : "right-1"}`}
    >
      <span className={dir === "left" ? "animate-nudge-left" : "animate-nudge-x"}>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.55, filter: "drop-shadow(0 1px 6px rgba(0,0,0,0.5))" }}
        >
          {dir === "left"
            ? <polyline points="15 18 9 12 15 6" />
            : <polyline points="9 18 15 12 9 6" />}
        </svg>
      </span>
    </button>
  );
}

// ── Image reorder modal ──────────────────────────────
function ImageReorderModal({
  initialImages,
  coverIndex,
  onClose,
  onSave,
}: {
  initialImages: string[];
  coverIndex: number;
  onClose: () => void;
  onSave: (images: string[], newCoverIndex: number) => void;
}) {
  const coverUrl = initialImages[coverIndex] ?? initialImages[0];
  const [images, setImagesState] = useState<string[]>(initialImages);
  const imagesRef = useRef<string[]>(initialImages);
  const [dragging, setDragging] = useState<number | null>(null);
  const draggingRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  function setImgs(next: string[]) {
    imagesRef.current = next;
    setImagesState(next);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, idx: number) {
    e.preventDefault();
    gridRef.current?.setPointerCapture(e.pointerId);
    draggingRef.current = idx;
    setDragging(idx);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingRef.current === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest("[data-img-idx]") as HTMLElement | null;
    if (!card) return;
    const toIdx = Number(card.getAttribute("data-img-idx"));
    if (isNaN(toIdx) || toIdx === draggingRef.current) return;
    const next = [...imagesRef.current];
    const [moved] = next.splice(draggingRef.current, 1);
    next.splice(toIdx, 0, moved);
    draggingRef.current = toIdx;
    setImgs(next);
    setDragging(toIdx);
  }

  function handlePointerUp() {
    draggingRef.current = null;
    setDragging(null);
  }

  function handleSave() {
    const newCoverIdx = imagesRef.current.indexOf(coverUrl);
    onSave(imagesRef.current, newCoverIdx >= 0 ? newCoverIdx : 0);
  }

  return (
    <div className="fixed inset-0 z-[450] bg-black/96 flex flex-col overscroll-contain">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
        <div>
          <p className="text-white text-[11px] tracking-[3px] uppercase font-medium">Reorder Images</p>
          <p className="text-white/40 text-[9px] tracking-[2px] uppercase mt-0.5">
            Hold &amp; drag to reorder · Cover image follows automatically
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#b3a384] hover:bg-[#9e8f70] transition-colors text-white text-[9px] tracking-[2px] uppercase font-bold rounded-sm"
          >
            Save Order
          </button>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 -mr-2 text-2xl leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          ref={gridRef}
          className="grid grid-cols-3 gap-2"
          style={{ touchAction: "none", cursor: dragging !== null ? "grabbing" : "grab" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {images.map((src, i) => {
            const isDraggingThis = dragging === i;
            const isCover = src === coverUrl;
            return (
              <div
                key={src}
                data-img-idx={i}
                onPointerDown={(e) => handlePointerDown(e, i)}
                className={`relative aspect-[3/4] overflow-hidden rounded-sm select-none transition-all duration-150 ${
                  isDraggingThis
                    ? "ring-[3px] ring-[#b3a384] ring-offset-2 scale-[1.04] shadow-2xl opacity-90 z-10"
                    : "ring-1 ring-white/10 cursor-grab"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizeImage(src)}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  draggable={false}
                />
                {/* dim overlay + grip */}
                <div className={`absolute inset-0 flex items-end justify-center pb-2 transition-all ${isDraggingThis ? "bg-black/45" : "bg-black/20"}`}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-md shadow ${isDraggingThis ? "bg-[#b3a384]" : "bg-black/45"}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <circle cx="8.5" cy="7" r="1.8" /><circle cx="15.5" cy="7" r="1.8" />
                      <circle cx="8.5" cy="12" r="1.8" /><circle cx="15.5" cy="12" r="1.8" />
                      <circle cx="8.5" cy="17" r="1.8" /><circle cx="15.5" cy="17" r="1.8" />
                    </svg>
                  </div>
                </div>
                {/* Position */}
                <div className={`absolute top-2 left-2 w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center shadow ${isDraggingThis ? "bg-[#b3a384] text-white" : "bg-black/55 text-white"}`}>
                  {i + 1}
                </div>
                {/* Cover badge */}
                {isCover && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#b3a384] text-white text-[7px] tracking-[1.5px] uppercase font-bold rounded shadow">
                    Cover
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Edit-mode card (drag to reorder + cover picker + image reorder) ─
function EditCard({
  coll,
  idx,
  isDragging,
  onPointerDown,
  onPickCover,
  onReorderImages,
}: {
  coll: Collection;
  idx: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPickCover: () => void;
  onReorderImages: () => void;
}) {
  const label = coll.name || `Design ${idx + 1}`;
  const hasMultiple = coll.images.length > 1;

  return (
    <div
      data-drag-idx={idx}
      onPointerDown={onPointerDown}
      className={`relative select-none transition-all duration-150 ${
        isDragging
          ? "ring-[3px] ring-[#b3a384] ring-offset-4 scale-[1.04] shadow-2xl z-10 opacity-90"
          : "cursor-grab hover:scale-[0.98]"
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm ring-1 ring-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizeImage(coverImg(coll))}
          alt={label}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Overlay with grip icon */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${isDragging ? "bg-black/40" : "bg-black/20"}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-lg transition-all ${isDragging ? "bg-[#b3a384] text-white scale-110" : "bg-black/50 text-white/80"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8.5" cy="7" r="1.8" /><circle cx="15.5" cy="7" r="1.8" />
              <circle cx="8.5" cy="12" r="1.8" /><circle cx="15.5" cy="12" r="1.8" />
              <circle cx="8.5" cy="17" r="1.8" /><circle cx="15.5" cy="17" r="1.8" />
            </svg>
          </div>
        </div>

        {/* Position badge */}
        <div className={`absolute top-2 left-2 w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center shadow ${isDragging ? "bg-[#b3a384] text-white" : "bg-black/55 text-white"}`}>
          {idx + 1}
        </div>

        {/* Cover image indicator badge */}
        {(coll.coverIndex ?? 0) > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#b3a384] text-white text-[7px] tracking-[1.5px] uppercase font-bold rounded">
            Cover #{(coll.coverIndex ?? 0) + 1}
          </div>
        )}

        {/* Bottom action buttons */}
        {hasMultiple && (
          <div
            className="absolute bottom-0 left-0 right-0 flex"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={onPickCover}
              className="flex-1 py-2 bg-black/60 hover:bg-black/80 transition-colors text-white text-[7px] tracking-[1.5px] uppercase font-medium flex items-center justify-center gap-1 border-r border-white/15"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Cover
            </button>
            <button
              onClick={onReorderImages}
              className="flex-1 py-2 bg-black/60 hover:bg-black/80 transition-colors text-white text-[7px] tracking-[1.5px] uppercase font-medium flex items-center justify-center gap-1"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Reorder
            </button>
          </div>
        )}
      </div>

      {coll.name && (
        <h2 className={`mt-3 font-display text-[11px] sm:text-sm uppercase tracking-[0.1em] text-center leading-snug transition-colors ${isDragging ? "text-[#b3a384]" : "text-[#aaa]"}`}>
          {coll.name}
        </h2>
      )}
    </div>
  );
}

// ── View-mode card ────────────────────────────────────
function ViewCard({ coll, idx, onOpen }: { coll: Collection; idx: number; onOpen: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
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
    setAtStart(el.scrollLeft <= 5);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 5);
    setCurrentIdx(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const scrollTo = (dir: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="group text-left relative cursor-pointer" onClick={onOpen}>
      <div className="relative aspect-[3/4] bg-[#f0ede8] overflow-hidden">
        {/* Image carousel */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={(e) => e.stopPropagation()} // scroll area handles its own click
          className="flex h-full overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {[
            coll.images[coll.coverIndex ?? 0],
            ...coll.images.filter((_, i) => i !== (coll.coverIndex ?? 0)),
          ].map((src, i) => (
            <div key={i} className="flex-none h-full" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizeImage(src)}
                alt={`${label} ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
                onClick={onOpen}
              />
            </div>
          ))}
        </div>

        {hasMultiple && !atStart && <ArrowBtn dir="left" onClick={(e) => scrollTo(-1, e)} />}
        {hasMultiple && !atEnd && <ArrowBtn dir="right" onClick={(e) => scrollTo(1, e)} />}

        {/* Image counter dots */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {coll.images.length <= 8 ? (
              coll.images.map((_, i) => (
                <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i === currentIdx ? "w-4 bg-white" : "w-[3px] bg-white/50"}`} />
              ))
            ) : (
              <span className="text-[9px] text-white/80 font-medium tracking-wider bg-black/25 rounded-full px-2 py-0.5">
                {currentIdx + 1} / {coll.images.length}
              </span>
            )}
          </div>
        )}
      </div>

      {coll.name && (
        <h2 className="mt-4 font-display text-[11px] sm:text-sm md:text-base uppercase tracking-[0.1em] text-center leading-snug text-[#1a1a1a] group-hover:text-[#b3a384] transition-colors">
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

  const [viewOrder, setViewOrder] = useState<Collection[]>(filled);
  useEffect(() => {
    setViewOrder(collections.filter((c) => c.images.length > 0));
  }, [collections]);

  const [items, setItemsState] = useState<Collection[]>([]);
  const itemsRef = useRef<Collection[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const draggingRef = useRef<number | null>(null);
  const preDragRef = useRef<Collection[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cover picker state
  const [coverPickerFor, setCoverPickerFor] = useState<{
    collId: string;
    images: string[];
    currentIdx: number;
  } | null>(null);

  // Image reorder state
  const [imageReorderFor, setImageReorderFor] = useState<{
    collId: string;
    images: string[];
    coverIndex: number;
  } | null>(null);

  function setItems(next: Collection[]) {
    itemsRef.current = next;
    setItemsState(next);
  }

  useEffect(() => {
    if (!section || !year) return;
    getAdminStatus().then((ok) => { if (ok) setIsAdmin(true); });
  }, [section, year]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = (open || coverPickerFor || imageReorderFor) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open, coverPickerFor, imageReorderFor]);

  function enterEdit() {
    const snapshot = [...viewOrder];
    itemsRef.current = snapshot;
    setItemsState(snapshot);
    draggingRef.current = null;
    setDragging(null);
    setEditMode(true);
  }

  function exitEdit() {
    draggingRef.current = null;
    setDragging(null);
    setEditMode(false);
  }

  // ── Drag handlers (collection reorder) ──
  function handleCardPointerDown(e: React.PointerEvent<HTMLDivElement>, idx: number) {
    e.preventDefault();
    gridRef.current?.setPointerCapture(e.pointerId);
    preDragRef.current = [...itemsRef.current];
    draggingRef.current = idx;
    setDragging(idx);
  }

  function handleGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingRef.current === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = el?.closest("[data-drag-idx]") as HTMLElement | null;
    if (!cardEl) return;
    const toIdx = Number(cardEl.getAttribute("data-drag-idx"));
    if (isNaN(toIdx) || toIdx === draggingRef.current) return;
    const next = [...itemsRef.current];
    const [dragged] = next.splice(draggingRef.current, 1);
    next.splice(toIdx, 0, dragged);
    draggingRef.current = toIdx;
    setItems(next);
    setDragging(toIdx);
  }

  async function handleGridPointerUp() {
    if (draggingRef.current === null) return;
    draggingRef.current = null;
    setDragging(null);
    const finalItems = itemsRef.current;
    setSaving(true);
    try {
      await fetch("/api/admin/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, year, collections: finalItems }),
      });
      setViewOrder(finalItems);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleGridPointerCancel() {
    if (draggingRef.current === null) return;
    draggingRef.current = null;
    setDragging(null);
    setItems(preDragRef.current);
  }

  async function handleSetCover(imageIdx: number) {
    if (!coverPickerFor) return;
    const { collId } = coverPickerFor;
    const patch = (arr: Collection[]) =>
      arr.map((c) => (c.id === collId ? { ...c, coverIndex: imageIdx } : c));
    setItems(patch(itemsRef.current));
    itemsRef.current = patch(itemsRef.current);
    setViewOrder((v) => patch(v));
    setCoverPickerFor(null);
    setSaving(true);
    try {
      await fetch("/api/admin/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, year, collectionId: collId, coverIndex: imageIdx }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveImageOrder(images: string[], newCoverIndex: number) {
    if (!imageReorderFor) return;
    const { collId } = imageReorderFor;
    const patch = (arr: Collection[]) =>
      arr.map((c) => (c.id === collId ? { ...c, images, coverIndex: newCoverIndex } : c));
    setItems(patch(itemsRef.current));
    itemsRef.current = patch(itemsRef.current);
    setViewOrder((v) => patch(v));
    setImageReorderFor(null);
    setSaving(true);
    try {
      await fetch("/api/admin/reorder-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, year, collectionId: collId, images, coverIndex: newCoverIndex }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──
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

  const displayItems = editMode ? items : viewOrder;
  const { grid, wrap } = adaptiveGrid(displayItems.length);

  return (
    <>
      {/* Admin controls */}
      {isAdmin && (
        <div className="mb-5 flex items-center justify-between gap-3 min-h-[36px]">
          <div className="flex items-center gap-2">
            {editMode && saving && (
              <span className="text-[9px] text-[#aaa] tracking-[2px] uppercase">Saving…</span>
            )}
            {editMode && saved && !saving && (
              <span className="text-[9px] text-green-600 tracking-[2px] uppercase font-bold animate-pulse">✓ Saved</span>
            )}
            {editMode && !saving && !saved && dragging !== null && (
              <span className="text-[9px] text-[#b3a384] tracking-[2px] uppercase font-medium">Dragging…</span>
            )}
            {editMode && !saving && !saved && dragging === null && (
              <span className="text-[9px] text-[#b3a384] tracking-[2px] uppercase font-medium">
                Hold &amp; drag to reorder
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
        <div
          ref={gridRef}
          className={`grid ${grid} gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-14`}
          style={editMode ? { touchAction: "none", cursor: dragging !== null ? "grabbing" : "grab" } : {}}
          onPointerMove={editMode ? handleGridPointerMove : undefined}
          onPointerUp={editMode ? handleGridPointerUp : undefined}
          onPointerCancel={editMode ? handleGridPointerCancel : undefined}
        >
          {displayItems.map((coll, idx) =>
            editMode ? (
              <EditCard
                key={coll.id}
                coll={coll}
                idx={idx}
                isDragging={dragging === idx}
                onPointerDown={(e) => handleCardPointerDown(e, idx)}
                onPickCover={() => setCoverPickerFor({
                  collId: coll.id,
                  images: coll.images,
                  currentIdx: coll.coverIndex ?? 0,
                })}
                onReorderImages={() => setImageReorderFor({
                  collId: coll.id,
                  images: coll.images,
                  coverIndex: coll.coverIndex ?? 0,
                })}
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

      {/* Image reorder modal */}
      {imageReorderFor && (
        <ImageReorderModal
          initialImages={imageReorderFor.images}
          coverIndex={imageReorderFor.coverIndex}
          onClose={() => setImageReorderFor(null)}
          onSave={handleSaveImageOrder}
        />
      )}

      {/* Cover image picker */}
      {coverPickerFor && (
        <div className="fixed inset-0 z-[400] bg-black/95 flex flex-col overscroll-contain">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-white text-[11px] tracking-[3px] uppercase font-medium">Select Cover Image</p>
              <p className="text-white/40 text-[9px] tracking-[2px] uppercase mt-0.5">
                Tap the image you want shown on the card
              </p>
            </div>
            <button
              onClick={() => setCoverPickerFor(null)}
              className="text-white/60 hover:text-white transition-colors p-2 -mr-2 text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-2">
              {coverPickerFor.images.map((src, i) => {
                const isActive = i === coverPickerFor.currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => handleSetCover(i)}
                    className={`relative aspect-[3/4] overflow-hidden rounded-sm transition-all ${
                      isActive ? "ring-[3px] ring-[#b3a384] ring-offset-2" : "ring-1 ring-white/10 hover:ring-white/30"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={optimizeImage(src)}
                      alt={`Image ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-[#b3a384] flex items-center justify-center shadow-lg">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 py-1 bg-black/50 text-white text-[8px] text-center tracking-wider">
                      {isActive ? "Current Cover" : `Image ${i + 1}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
