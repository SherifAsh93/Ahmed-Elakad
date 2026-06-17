"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

// ── Grip icon for drag handle ────────────────────────
function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8.5" cy="7" r="1.8"/><circle cx="15.5" cy="7" r="1.8"/>
      <circle cx="8.5" cy="12" r="1.8"/><circle cx="15.5" cy="12" r="1.8"/>
      <circle cx="8.5" cy="17" r="1.8"/><circle cx="15.5" cy="17" r="1.8"/>
    </svg>
  );
}

// ── Image reorder modal (admin) ──────────────────────
function ImageReorderModal({
  coll,
  collIdx,
  onSave,
  onClose,
}: {
  coll: Collection;
  collIdx: number;
  onSave: (idx: number, images: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [images, setImages] = useState([...coll.images]);
  const dragIdx = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleDragStart = (e: React.DragEvent, i: number) => {
    dragIdx.current = i;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === i) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    setImages(next);
    dragIdx.current = i;
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(collIdx, images);
    setSaving(false);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[400] bg-black/92 overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div>
          {coll.name && <p className="text-white font-display text-sm uppercase tracking-[3px]">{coll.name}</p>}
          <p className="text-white/45 text-[9px] uppercase tracking-[3px] font-bold mt-0.5">
            Drag images to reorder · {images.length} images
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#b3a384] text-white text-[9px] tracking-[2px] uppercase font-bold hover:bg-[#a09072] transition-colors disabled:opacity-50 rounded-sm"
          >
            {saving ? "Saving…" : "Save Order"}
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white p-2 text-2xl leading-none transition-colors">✕</button>
        </div>
      </div>
      {/* Image grid */}
      <div className="p-4 sm:p-8 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {images.map((src, i) => (
            <div
              key={src + i}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={() => { dragIdx.current = null; }}
              onDrop={(e) => e.preventDefault()}
              className="relative aspect-[3/4] bg-[#222] rounded overflow-hidden cursor-grab active:cursor-grabbing group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizeImage(src)} alt="" className="w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-80 transition-opacity">
                  <GripIcon />
                </span>
              </div>
              <span className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 rounded text-white text-[8px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Individual collection card ───────────────────────
function CollectionCard({
  coll,
  idx,
  onOpen,
  editMode,
  onEditImages,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  coll: Collection;
  idx: number;
  onOpen: () => void;
  editMode: boolean;
  onEditImages: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
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
    scrollRef.current?.scrollBy({ left: dir * (scrollRef.current.clientWidth), behavior: "smooth" });
  };

  return (
    <div
      className={`group text-left relative transition-all duration-200
        ${editMode ? "cursor-grab active:cursor-grabbing select-none" : ""}
        ${isDragging ? "opacity-40 scale-[0.98]" : ""}
        ${isDragOver && !isDragging ? "ring-2 ring-[#b3a384] ring-offset-2 rounded-sm" : ""}
      `}
      draggable={editMode}
      onDragStart={editMode ? (e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); } : undefined}
      onDragOver={editMode ? onDragOver : undefined}
      onDragEnd={editMode ? onDragEnd : undefined}
      onDrop={editMode ? (e) => e.preventDefault() : undefined}
      onClick={editMode ? onEditImages : undefined}
      onPointerDown={!editMode ? () => { scrolledRef.current = false; } : undefined}
    >
      {/* Drag handle badge (edit mode only) */}
      {editMode && (
        <div className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded bg-black/65 text-white/90 shadow">
          <GripIcon />
        </div>
      )}

      {/* Image area */}
      <div className={`relative aspect-[3/4] bg-[#f0ede8] mb-5 overflow-hidden ${editMode ? "pointer-events-none" : ""}`}>
        {/* Scrollable strip */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={!editMode ? () => { if (!scrolledRef.current) onOpen(); } : undefined}
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
        <div className={`absolute inset-0 transition-all duration-500 pointer-events-none ${editMode ? "bg-black/20" : "bg-black/0 group-hover:bg-black/10"}`} />

        {/* Arrow nav (view mode only) */}
        {!editMode && hasMultiple && !atStart && <ArrowBtn dir="left" onClick={(e) => scrollTo(-1, e)} />}
        {!editMode && hasMultiple && !atEnd && <ArrowBtn dir="right" onClick={(e) => scrollTo(1, e)} />}

        {/* Edit mode overlay hint */}
        {editMode && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
            <span className="text-[8px] text-white/70 tracking-[2px] uppercase bg-black/40 rounded-full px-3 py-1">
              Click to reorder images
            </span>
          </div>
        )}

        {/* Dot / counter (view mode only) */}
        {!editMode && hasMultiple && (
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

      {/* Collection name */}
      {coll.name && (
        <h2
          onClick={!editMode ? onOpen : undefined}
          className={`font-display text-[11px] sm:text-sm md:text-base uppercase tracking-[0.1em] text-center leading-snug transition-colors ${
            editMode ? "text-[#b3a384]" : "text-[#1a1a1a] cursor-pointer group-hover:text-[#b3a384]"
          }`}
        >
          {coll.name}
        </h2>
      )}
    </div>
  );
}

// ── Main CollectionGrid export ───────────────────────
export default function CollectionGrid({ collections, section, year }: CollectionGridProps) {
  const filled = collections.filter((c) => c.images.length > 0);

  // Gallery modal state
  const [open, setOpen] = useState<Collection | null>(null);

  // Admin state
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [ordered, setOrdered] = useState<Collection[]>(filled);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingColl, setEditingColl] = useState<{ coll: Collection; idx: number } | null>(null);

  // DnD refs
  const dragRef = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Sync when collections prop changes (year navigation)
  useEffect(() => {
    setOrdered(collections.filter((c) => c.images.length > 0));
    setHasChanges(false);
    setEditMode(false);
  }, [collections]);

  // Check admin session
  useEffect(() => {
    if (!section || !year || year === "all") return;
    fetch("/api/auth")
      .then((r) => { if (r.ok) setIsAdminUser(true); })
      .catch(() => {});
  }, [section, year]);

  // Keyboard ESC closes gallery
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── DnD handlers ──
  const handleDragStart = (idx: number) => {
    dragRef.current = idx;
    setDraggingIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
    const from = dragRef.current;
    if (from === null || from === idx) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setOrdered(next);
    dragRef.current = idx;
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    dragRef.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  // ── Save collection order ──
  const saveOrder = async () => {
    if (!section || !year) return;
    setSaving(true);
    try {
      await fetch("/api/admin/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, year, collections: ordered }),
      });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Save image order within a collection ──
  const saveImageOrder = async (collIdx: number, images: string[]) => {
    if (!section || !year) return;
    const updated = ordered.map((c, i) => (i === collIdx ? { ...c, images } : c));
    setOrdered(updated);
    setEditingColl(null);
    setHasChanges(true);
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, year, collections: updated }),
    });
    setHasChanges(false);
  };

  const displayItems = editMode ? ordered : filled;

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

  const { grid, wrap } = adaptiveGrid(displayItems.length);

  return (
    <>
      {/* Admin inline controls — inline so they work correctly in the "All" view too */}
      {isAdminUser && (
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            {editMode ? (
              <p className="text-[9px] text-[#b3a384] tracking-[2px] uppercase font-medium">
                Drag designs to reorder · click a design to reorder its images
              </p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2 shrink-0">
              {editMode && hasChanges && (
                <button
                  onClick={saveOrder}
                  disabled={saving}
                  className="px-4 py-2 bg-[#b3a384] text-white text-[8px] tracking-[2px] uppercase font-bold hover:bg-[#a09072] transition-colors disabled:opacity-60 rounded-sm"
                >
                  {saving ? "Saving…" : "✓ Save"}
                </button>
              )}
              <button
                onClick={() => { setEditMode((v) => !v); setHasChanges(false); }}
                className={`px-4 py-2 text-[8px] tracking-[2px] uppercase font-bold transition-all rounded-sm border ${
                  editMode
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "bg-white text-[#555] border-[#ccc] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
                }`}
              >
                {editMode ? "✕ Exit Edit" : "⠿ Edit Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={wrap}>
        <div className={`grid ${grid} gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-14`}>
          {displayItems.map((coll, idx) => (
            <CollectionCard
              key={coll.id}
              coll={coll}
              idx={idx}
              onOpen={() => setOpen(coll)}
              editMode={editMode}
              onEditImages={() => setEditingColl({ coll, idx })}
              isDragging={draggingIdx === idx}
              isDragOver={dragOverIdx === idx && draggingIdx !== idx}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Full-screen gallery modal (view mode) */}
      {open && !editMode && (
        <div
          className="fixed inset-0 z-[300] bg-black/96 overflow-y-auto overscroll-contain"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-8 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <div>
              {open.name && <p className="text-white font-display text-sm uppercase tracking-[3px]">{open.name}</p>}
              <p className="text-white/50 text-[10px] uppercase tracking-[3px] font-bold mt-0.5">
                {open.images.length} {open.images.length === 1 ? "Image" : "Images"}
              </p>
            </div>
            <button onClick={() => setOpen(null)} className="text-white/70 hover:text-white transition-colors p-2 -mr-2 text-2xl leading-none" aria-label="Close">✕</button>
          </div>
          <div className="px-3 sm:px-8 md:px-12 py-6 max-w-screen-xl mx-auto">
            <MasonryGallery images={open.images} />
          </div>
        </div>
      )}

      {/* Image reorder modal (admin edit mode) */}
      {editingColl && (
        <ImageReorderModal
          coll={editingColl.coll}
          collIdx={editingColl.idx}
          onSave={saveImageOrder}
          onClose={() => setEditingColl(null)}
        />
      )}
    </>
  );
}
