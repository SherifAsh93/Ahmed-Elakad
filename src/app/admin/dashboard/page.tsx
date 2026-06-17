"use client";

import React, { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import Image from "next/image";
import { SiteContent, CategoryYear } from "@/lib/content";
import { compressImage } from "@/lib/compressImage";

// Module-level thumbnail cache populated from server-signed URLs
const thumbMap = new Map<string, string>();
function getThumb(url: string): string {
  return thumbMap.get(url) || url;
}

type Section =
  | "site"
  | "home"
  | "about"
  | "bridal"
  | "couture"
  | "experience"
  | "contact"
  | "social"
  | "media"
  | "messages"
  | "clients";

interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

interface Dress {
  id: string;
  label: string;
  images: string[];
  createdAt: string;
}

interface VoiceNote {
  id: string;
  url: string;
  from: "atelier" | "admin";
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  totalPrice: number;
  payments: Payment[];
  dresses: Dress[];
  voiceNotes: VoiceNote[];
  appointmentDate: string;
  appointmentTime: string;
  nextAppointmentDate: string;
  fittingDate: string;
  fittingTime: string;
  eventDate: string;
  dressType: "wedding" | "evening" | "";
  branch: "cairo" | "damietta" | "";
  clientImages: string[];
  status: "active" | "completed" | "pending";
  createdAt: string;
  sourceMessageId?: string;
}

function clientPaid(c: Client) {
  return c.payments.reduce((s, p) => s + p.amount, 0);
}
function clientRemaining(c: Client) {
  return Math.max(0, c.totalPrice - clientPaid(c));
}
function to12h(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Image Picker Modal ───────────────────
function ImagePicker({
  allImages,
  onSelect,
  onClose,
  onUploadComplete,
  inline = false,
  multi = true, // Default to multi-selection for better efficiency
}: {
  allImages: string[];
  onSelect: (srcs: string[]) => void;
  onClose?: () => void;
  onUploadComplete?: () => void;
  inline?: boolean;
  multi?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [pasteUrl, setPasteUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [urlPreviewOk, setUrlPreviewOk] = useState(false);
  const [isGrabbingUrl, setIsGrabbingUrl] = useState(false);
  const [grabStatus, setGrabStatus] = useState("");

  useEffect(() => {
    if (pasteUrl.includes("console.cloudinary.com") || pasteUrl.includes("collection.cloudinary.com")) {
      setUrlError("You pasted a Cloudinary Console link. Please right-click the image and select 'Copy image address' instead.");
      setUrlPreviewOk(false);
    } else {
      setUrlError("");
    }
  }, [pasteUrl]);
  const [activeTab, setActiveTab] = useState<"browse" | "url">("browse");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());
  const [deletedImages, setDeletedImages] = useState<Set<string>>(new Set());
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting" | "done" | "error">("idle");
  const perPage = 24;
  const filtered = allImages.filter((img) =>
    img && !errorImages.has(img) && !deletedImages.has(img)
  );
  const total = Math.ceil(filtered.length / perPage);
  const displayed = filtered.slice(page * perPage, (page + 1) * perPage);

  // Reset loaded state when page changes so skeletons show on new page
  useEffect(() => {
    setLoadedImages(new Set());
  }, [page]);

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src));
  };

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const compressionOptions = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
    };

    try {
      const total = files.length;
      for (let i = 0; i < total; i++) {
        const originalFile = files[i];

        setUploadStatus(`Optimizing ${i + 1}/${total}...`);
        const fileToUpload = await compressImage(originalFile);

        setUploadStatus(`Uploading ${i + 1}/${total}...`);
        const singleFormData = new FormData();
        singleFormData.append("files", fileToUpload, originalFile.name);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: singleFormData,
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Upload failed for ${originalFile.name}`,
          );
        }
      }

      setUploadStatus("Upload Successful!");
      if (onUploadComplete) {
        onUploadComplete();
        setUploadStatus("Updating Library...");
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed.");
      setUploadStatus(null);
    }
  };

  const handlePasteUrl = async () => {
    const url = pasteUrl.trim();
    if (!url) return;

    // Already our Cloudinary URL — use directly
    if (url.includes("res.cloudinary.com/")) {
      onSelect([url]);
      setPasteUrl("");
      if (onClose) onClose();
      return;
    }

    // Fetch from external URL and upload to Cloudinary
    setIsGrabbingUrl(true);
    setUrlError("");
    setGrabStatus("Fetching image…");

    try {
      const res = await fetch("/api/grab-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setUrlError(data.error || "Failed to grab image.");
        setGrabStatus("");
        return;
      }

      setGrabStatus("Saved to Cloudinary!");
      if (onUploadComplete) onUploadComplete();

      setTimeout(() => {
        onSelect([data.cloudinaryUrl]);
        setPasteUrl("");
        setGrabStatus("");
        if (onClose) onClose();
      }, 800);
    } catch {
      setUrlError("Network error. Please try again.");
      setGrabStatus("");
    } finally {
      setIsGrabbingUrl(false);
    }
  };

  const handleSelectImage = (src: string) => {
    if (!multi) {
      setSelectedImages(new Set([src]));
      return;
    }
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const urls = Array.from(selectedImages);
    if (!urls.length) return;
    if (!window.confirm(`Delete ${urls.length} image${urls.length > 1 ? "s" : ""} permanently from Cloudinary?`)) return;
    setDeleteStatus("deleting");
    try {
      await Promise.all(urls.map((url) =>
        fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
      ));
      setDeletedImages((prev) => new Set([...prev, ...urls]));
      setSelectedImages(new Set());
      setDeleteStatus("done");
      setTimeout(() => setDeleteStatus("idle"), 2000);
    } catch {
      setDeleteStatus("error");
      setTimeout(() => setDeleteStatus("idle"), 3000);
    }
  };

  const handleConfirmSelection = () => {
    const urls = Array.from(selectedImages);
    if (urls.length > 0) {
      onSelect(urls);
      setSelectedImages(new Set());
      if (onClose) onClose();
    }
  };

  const isUploading = !!uploadStatus;

  return (
    <div
      className={
        inline
          ? "w-full flex items-center justify-center"
          : "fixed inset-0 bg-[#2a2218]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
      }
    >
      <div
        className={`bg-white w-full max-w-[98vw] flex flex-col overflow-hidden ${inline ? "h-[calc(100vh-12rem)] min-h-[400px] border border-gray-200 rounded-lg shadow-sm" : "h-[94vh] rounded-3xl shadow-2xl"}`}
      >
        {/* Progress Bar */}
        {isUploading && (
          <div className="h-1.5 bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-black via-[#b3a384] to-black animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
        )}

        {/* Header - Responsive Padding */}
        <div 
          className="flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 md:px-12 lg:px-[100px] py-4 sm:py-6 md:py-10 border-b gap-3 sm:gap-6 bg-white relative"
        >
          <div className="flex flex-col">
            <h3 className="font-display text-lg sm:text-2xl md:text-3xl uppercase tracking-[2px] sm:tracking-[3px] md:tracking-[6px] text-black mb-1">
              Image Manager
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[9px] text-gray-400 uppercase tracking-[4px] font-bold">
                {uploadStatus || `${allImages.length} assets synced from cloud`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tab Switcher */}
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 mr-2 flex-wrap gap-1 md:gap-0">
              <button
                onClick={() => setActiveTab("browse")}
                className={`text-[9px] font-black uppercase tracking-[2px] md:tracking-[3px] px-3 py-2 md:px-6 md:py-3 transition-all rounded-lg ${activeTab === "browse" ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"}`}
              >
                ☁️ Browse
              </button>
              <button
                onClick={() => setActiveTab("url")}
                className={`text-[9px] font-black uppercase tracking-[2px] md:tracking-[3px] px-3 py-2 md:px-6 md:py-3 transition-all rounded-lg ${activeTab === "url" ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"}`}
              >
                🔗 External
              </button>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="picker-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="picker-upload"
              className={`text-[10px] font-bold uppercase tracking-[2px] px-5 py-2.5 border-2 border-black transition-all rounded-lg cursor-pointer ${isUploading ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white hover:bg-black hover:text-white"}`}
            >
              {uploadStatus ? "PLEASE WAIT" : "↑ UPLOAD"}
            </label>
            {/* Close Button */}
            {!inline && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-black transition-colors font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-xl shrink-0 ml-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab: Browse */}
        {activeTab === "browse" && (
          <>
            {/* Image Grid - Responsive Padding */}
            <div 
              className="overflow-y-auto py-4 sm:py-8 md:py-16 flex-1 bg-gray-50 flex flex-col px-2 sm:px-4 md:px-12 lg:px-[100px]"
            >
              {allImages.length === 0 && !isUploading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-4 py-20">
                  <span className="text-5xl mb-6">☁️</span>
                  <p className="text-sm uppercase tracking-[4px] font-bold">
                    Your Cloud is Empty
                  </p>
                  <p className="text-[10px] uppercase tracking-widest mt-3 text-gray-300">
                    Upload images or paste a URL to begin
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-5">
                  {displayed.map((src) => {
                    const isSelected = selectedImages.has(src);
                    const isLoaded = loadedImages.has(src);
                    return (
                      <div
                        key={src}
                        className={`relative aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? "ring-4 ring-[#b3a384] shadow-lg scale-95"
                            : "ring-2 ring-gray-200 hover:ring-black shadow-md hover:shadow-xl"
                        }`}
                        onClick={() => handleSelectImage(src)}
                      >
                        {/* Loading Skeleton — shown until image finishes loading */}
                        {!isLoaded && (
                          <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
                        )}

                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getThumb(src)}
                          alt=""
                          className="w-full h-full object-cover"
                          loading={page === 0 ? "eager" : "lazy"}
                          decoding="async"
                          onLoad={() => handleImageLoad(src)}
                          onError={() => {
                            setErrorImages(prev => new Set(prev).add(src));
                            handleImageLoad(src);
                          }}
                        />

                        {/* Overlay */}
                        <div
                          className={`absolute inset-0 transition-all ${
                            isSelected
                              ? "bg-black/40"
                              : "bg-black/0 hover:bg-black/20"
                          }`}
                        />

                        {/* Checkbox */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all bg-white/90 border-black">
                          {isSelected && (
                            <span className="text-black text-sm font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Selection Text */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                            <p className="text-[10px] text-white uppercase tracking-[2px] font-black drop-shadow-lg bg-black/50 px-3 py-1.5 rounded-full border border-white/20">
                              SELECTED
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selection Confirm Bar — compact strip */}
            {selectedImages.size > 0 && (
              <div className="bg-black px-4 sm:px-8 py-3 border-t border-white/10 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-white text-[11px] font-black uppercase tracking-[2px]">
                  {selectedImages.size} image{selectedImages.size > 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedImages(new Set())}
                    className="text-white/60 text-[10px] font-black uppercase tracking-[2px] px-5 py-2 border border-white/20 rounded-full hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deleteStatus === "deleting"}
                    className="text-white text-[10px] font-black uppercase tracking-[2px] px-5 py-2 bg-red-600 rounded-full hover:bg-red-700 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
                  >
                    {deleteStatus === "deleting" ? "Deleting..." : deleteStatus === "done" ? "Deleted ✓" : deleteStatus === "error" ? "Failed ✗" : "Delete"}
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="text-black text-[10px] font-black uppercase tracking-[2px] px-6 py-2 bg-white rounded-full hover:bg-[#b3a384] hover:text-white transition-all active:scale-95 whitespace-nowrap"
                  >
                    Confirm &amp; Save
                  </button>
                </div>
              </div>
            )}

            {/* Pagination - Forced Massive Padding */}
            {total > 1 && (
              <div 
                className="flex items-center justify-center gap-4 sm:gap-6 md:gap-16 py-4 sm:py-6 md:py-12 px-4 md:px-12 lg:px-[100px] border-t bg-white"
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-6 py-2 md:px-8 md:py-3 border border-gray-200 rounded-full text-[9px] md:text-[10px] uppercase tracking-[2px] md:tracking-[3px] hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-10 font-black shadow-sm hover:shadow-xl active:scale-95"
                >
                  PREV
                </button>
                <div className="flex items-center gap-3">
                   <span className="w-1 h-1 rounded-full bg-gray-200" />
                   <span className="text-[10px] font-black tracking-[6px] text-black">
                     {page + 1} <span className="text-gray-300 mx-1">/</span> {total}
                   </span>
                   <span className="w-1 h-1 rounded-full bg-gray-200" />
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
                  disabled={page >= total - 1}
                  className="px-6 py-2 md:px-8 md:py-3 border border-gray-200 rounded-full text-[9px] md:text-[10px] uppercase tracking-[2px] md:tracking-[3px] hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-10 font-black shadow-sm hover:shadow-xl active:scale-95"
                >
                  NEXT
                </button>
              </div>
            )}
          </>
        )}

        {/* Tab: Paste URL */}
        {activeTab === "url" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#faf9f7] overflow-y-auto">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/5 mb-3">
                  <span className="text-2xl">🔗</span>
                </div>
                <h4 className="font-display text-lg uppercase tracking-[3px]">
                  Import from URL
                </h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-[2px] mt-1.5">
                  Paste any image URL — Instagram, Facebook, Cloudinary, or any direct link.<br />
                  External images are automatically uploaded to your Cloudinary library.
                </p>
              </div>

              <div className="flex items-stretch gap-3">
                <input
                  type="text"
                  value={pasteUrl}
                  onChange={(e) => {
                    setPasteUrl(e.target.value);
                    setUrlError("");
                    setUrlPreviewOk(false);
                    setGrabStatus("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isGrabbingUrl) handlePasteUrl();
                  }}
                  placeholder="https://instagram.com/p/... or https://scontent-..."
                  className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-5 py-3.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-mono"
                  disabled={isGrabbingUrl}
                />
                <button
                  onClick={handlePasteUrl}
                  disabled={!pasteUrl.trim() || isGrabbingUrl}
                  className="text-[11px] font-bold uppercase tracking-[2px] px-7 py-3.5 bg-black text-white rounded-xl hover:bg-[#b3a384] transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap shadow-lg"
                >
                  {isGrabbingUrl ? "…" : "Import"}
                </button>
              </div>

              {grabStatus && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-green-700 text-[11px] font-bold uppercase tracking-[2px]">{grabStatus}</p>
                </div>
              )}

              {urlError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-xs font-medium">{urlError}</p>
                </div>
              )}

              {/* Preview — only shown for direct Cloudinary URLs (previews immediately without fetching) */}
              {pasteUrl.trim() && !urlError && pasteUrl.includes("res.cloudinary.com/") && (
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg">
                  <div className="aspect-[4/3] relative bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pasteUrl.trim()}
                      alt="URL Preview"
                      className="w-full h-full object-contain"
                      onLoad={() => setUrlPreviewOk(true)}
                      onError={() => setUrlPreviewOk(false)}
                    />
                    {!urlPreviewOk && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">🖼️</span>
                          <p className="text-[10px] uppercase tracking-[2px] font-bold">Loading preview…</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {urlPreviewOk && (
                    <div className="p-3 border-t bg-green-50">
                      <p className="text-green-700 text-[10px] uppercase tracking-[2px] font-bold">
                        ✓ Cloudinary image ready — click Import to use
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                {[
                  { icon: "📸", label: "Instagram", hint: "Paste post URL or right-click image → Copy address" },
                  { icon: "👤", label: "Facebook", hint: "Right-click image → Copy image address" },
                  { icon: "☁️", label: "Cloudinary", hint: "Paste any res.cloudinary.com URL directly" },
                ].map(({ icon, label, hint }) => (
                  <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                    <span className="text-xl">{icon}</span>
                    <p className="text-[10px] font-black uppercase tracking-[2px] mt-1 mb-1">{label}</p>
                    <p className="text-[9px] text-gray-400 leading-relaxed">{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gallery Editor ──────────────────────
function GalleryEditor({
  images,
  allImages,
  onChange,
  onUploadComplete,
  label,
}: {
  images: string[];
  allImages: string[];
  onChange: (imgs: string[]) => void;
  onUploadComplete?: () => void;
  label: string;
}) {
  const [picker, setPicker] = useState(false);
  const add = (srcs: string[]) => onChange([...images, ...srcs]);
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">
          {label}
        </label>
        <button
          onClick={() => setPicker(true)}
          className="bg-black text-white text-[10px] tracking-[2px] px-6 py-2 uppercase font-bold hover:bg-[#333] transition-colors rounded shadow-sm"
        >
          + ADD IMAGE
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
        {images.map((src, i) => {
          // Safeguard against bad URLs from previous versions, or console links
          const isBadUrl =
            src.includes("console.cloudinary.com") ||
            src.includes("collection.cloudinary.com");
          return (
            <div
              key={src + i}
              className="relative group aspect-[3/4] bg-gray-100 rounded overflow-hidden shadow-sm"
            >
              {isBadUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 text-center p-2 border border-red-200">
                  <span className="text-lg">⚠️</span>
                  <span className="text-[8px] font-bold mt-1 uppercase">
                    Invalid URL
                  </span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getThumb(src)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.error-msg')) {
                      const div = document.createElement('div');
                      div.className = 'error-msg w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 text-center p-2 border border-red-200';
                      div.innerHTML = '<span class="text-lg">⚠️</span><span class="text-[8px] font-bold mt-1 uppercase">Broken</span>';
                      parent.appendChild(div);
                    }
                  }}
                />
              )}
              <button
                title="Remove"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10 transition-opacity shadow-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}
        {images.length === 0 && (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs uppercase tracking-widest">
            No images in gallery
          </div>
        )}
      </div>
      {picker && (
        <ImagePicker
          allImages={allImages}
          onSelect={add}
          onUploadComplete={onUploadComplete}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}

// ── Single Image Editor ─────────────────
function SingleImageEditor({
  image,
  allImages,
  onChange,
  onUploadComplete,
  label,
}: {
  image: string;
  allImages: string[];
  onChange: (src: string) => void;
  onUploadComplete?: () => void;
  label: string;
}) {
  const [picker, setPicker] = useState(false);
  const isBadUrl =
    image &&
    (image.includes("console.cloudinary.com") ||
      image.includes("collection.cloudinary.com"));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b pb-3">
        <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">
          {label}
        </label>
        <button
          onClick={() => setPicker(true)}
          className="text-black text-[10px] tracking-[2px] border border-black px-6 py-2 uppercase font-bold hover:bg-black hover:text-white transition-colors rounded"
        >
          CHANGE
        </button>
      </div>
      <div className="w-48 sm:w-64 aspect-[3/4] relative border-4 border-white shadow-xl rounded-sm bg-gray-100 overflow-hidden">
        {image ? (
          isBadUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 text-center p-2 border border-red-200">
              <span className="text-2xl mb-1">⚠️</span>
              <span className="text-[10px] font-bold uppercase">
                Invalid URL
              </span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getThumb(image)}
              alt="Preview"
              className="w-full h-full object-cover transition-transform hover:scale-110 duration-700"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.error-msg')) {
                  const div = document.createElement('div');
                  div.className = 'error-msg w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 text-center p-2 border border-red-200';
                  div.innerHTML = '<span class="text-2xl mb-1">⚠️</span><span class="text-[10px] font-bold uppercase">Broken</span>';
                  parent.appendChild(div);
                }
              }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-xs italic">
            NO IMAGE
          </div>
        )}
        {image && (
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full shadow transition-colors text-sm font-bold"
            title="Remove image"
          >
            ✕
          </button>
        )}
      </div>
      {picker && (
        <ImagePicker
          allImages={allImages}
          multi={false}
          onSelect={(urls) => onChange(urls[0])}
          onUploadComplete={onUploadComplete}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}

// ── Bio Paragraph Editor ────────────────
function BioParagraphEditor({
  bio,
  onChange,
}: {
  bio: string[];
  onChange: (b: string[]) => void;
}) {
  const add = () => onChange([...bio, ""]);
  const update = (i: number, val: string) => {
    const a = [...bio];
    a[i] = val;
    onChange(a);
  };
  const remove = (i: number) => onChange(bio.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">
          CONTENT PARAGRAPHS
        </label>
        <button
          onClick={add}
          className="text-[10px] font-bold text-[#b3a384] uppercase tracking-widest"
        >
          + ADD NEW
        </button>
      </div>
      {bio.map((p, i) => (
        <div
          key={i}
          className="relative group animate-in fade-in slide-in-from-top-2"
        >
          <textarea
            value={p}
            onChange={(e) => update(i, e.target.value)}
            className="admin-input text-base min-h-[120px] font-light leading-relaxed p-6 bg-white border-gray-100 shadow-inner"
            placeholder="Enter paragraph text..."
          />
          <button
            onClick={() => remove(i)}
            className="absolute top-4 right-4 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Testimonials Editor ─────────────────
interface TestimonialItem {
  id: string; quote: string; name: string; subtitle: string; rating: number;
}
function TestimonialsEditor({
  testimonials, onChange,
}: { testimonials: TestimonialItem[]; onChange: (t: TestimonialItem[]) => void }) {
  const add = () => onChange([...testimonials, { id: `t-${Date.now()}`, quote: "", name: "", subtitle: "", rating: 5 }]);
  const update = (i: number, field: keyof TestimonialItem, val: string | number) => {
    const a = [...testimonials]; a[i] = { ...a[i], [field]: val }; onChange(a);
  };
  const remove = (i: number) => onChange(testimonials.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const a = [...testimonials]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b pb-3">
        <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">TESTIMONIALS ({testimonials.length})</label>
        <button onClick={add} className="text-[10px] font-bold text-[#b3a384] uppercase tracking-widest min-h-[44px] px-3">+ ADD TESTIMONIAL</button>
      </div>
      {testimonials.length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-[10px] uppercase tracking-widest">No testimonials yet — click + ADD TESTIMONIAL</div>
      )}
      {testimonials.map((t, i) => (
        <div key={t.id} className="border border-gray-100 rounded-lg p-5 space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[3px] font-black text-gray-400">Testimonial {i + 1}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-black disabled:opacity-20 text-sm font-bold px-1 min-h-[44px]">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === testimonials.length - 1} className="text-gray-300 hover:text-black disabled:opacity-20 text-sm font-bold px-1 min-h-[44px]">↓</button>
              <button onClick={() => remove(i)} className="text-[10px] text-red-500 uppercase tracking-[2px] font-black border border-red-200 px-3 py-1.5 min-h-[44px] rounded hover:bg-red-50 transition-colors">✕ Delete</button>
            </div>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1.5 block">QUOTE TEXT</label>
            <textarea value={t.quote} onChange={(e) => update(i, "quote", e.target.value)} className="admin-input min-h-[100px] font-light leading-relaxed p-4 font-serif italic" placeholder="Enter client quote..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1.5 block">CLIENT NAME</label>
              <input value={t.name} onChange={(e) => update(i, "name", e.target.value)} className="admin-input" placeholder="e.g. Layan" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1.5 block">SUBTITLE</label>
              <input value={t.subtitle} onChange={(e) => update(i, "subtitle", e.target.value)} className="admin-input" placeholder="e.g. Bride, Dubai" />
            </div>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">STAR RATING</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => update(i, "rating", star)} className={`text-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${star <= (t.rating ?? 5) ? "text-[#b3a384]" : "text-gray-200 hover:text-[#b3a384]/50"}`}>★</button>
              ))}
              <span className="text-[10px] text-gray-400 ml-2">{t.rating ?? 5} / 5</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Video List Editor ────────────────────
interface VideoItemAdmin {
  id: string; url: string; title: string; clientName: string; clientSubtitle: string;
}
function getYoutubeThumbnail(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}
function VideoListEditor({
  videos, onChange,
}: { videos: VideoItemAdmin[]; onChange: (v: VideoItemAdmin[]) => void }) {
  const [downloading, setDownloading] = React.useState<Record<string, boolean>>({});
  const [uploading, setUploading] = React.useState<Record<string, boolean>>({});
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const add = () => onChange([...videos, { id: `v-${Date.now()}`, url: "", title: "", clientName: "", clientSubtitle: "" }]);
  const update = (i: number, field: keyof VideoItemAdmin, val: string) => {
    const a = [...videos]; a[i] = { ...a[i], [field]: val }; onChange(a);
  };
  const remove = (i: number) => onChange(videos.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const a = [...videos]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  };
  const downloadIg = async (i: number, igUrl: string) => {
    setDownloading(d => ({ ...d, [videos[i].id]: true }));
    try {
      const res = await fetch('/api/ig-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: igUrl }) });
      const data = await res.json();
      if (data.url) { update(i, 'url', data.url); }
      else alert(data.error || 'Download failed');
    } catch { alert('Download failed'); }
    finally { setDownloading(d => ({ ...d, [videos[i].id]: false })); }
  };
  const uploadVideo = async (i: number, file: File) => {
    setUploading(d => ({ ...d, [videos[i].id]: true }));
    try {
      const fd = new FormData(); fd.append('files', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.uploaded?.[0]) { update(i, 'url', data.uploaded[0]); }
      else alert(data.error || 'Upload failed');
    } catch { alert('Upload failed'); }
    finally { setUploading(d => ({ ...d, [videos[i].id]: false })); }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b pb-3">
        <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">CLIENT VIDEOS ({videos.length})</label>
        <button onClick={add} className="text-[10px] font-bold text-[#b3a384] uppercase tracking-widest min-h-[44px] px-3">+ ADD VIDEO</button>
      </div>
      {videos.length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-[10px] uppercase tracking-widest">No videos yet — paste YouTube, Vimeo, or direct MP4 links</div>
      )}
      {videos.map((v, i) => {
        const thumb = getYoutubeThumbnail(v.url);
        const isVimeo = v.url.includes("vimeo.com");
        return (
          <div key={v.id} className="border border-gray-100 rounded-lg p-5 space-y-4 bg-white shadow-sm">
            <div className="flex items-start gap-4">
              {/* Thumbnail preview */}
              <div className="shrink-0 w-[100px] aspect-video bg-gray-100 rounded overflow-hidden border border-gray-100">
                {thumb ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={thumb} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : isVimeo ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1ab7ea]/10">
                    <span className="text-[8px] text-[#1ab7ea] font-bold uppercase tracking-widest">Vimeo</span>
                  </div>
                ) : v.url.match(/\.(mp4|webm|ogg)/i) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">MP4</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><polygon points="6,3 20,12 6,21"/></svg>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[3px] font-black text-gray-400">Video {i + 1}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-black disabled:opacity-20 text-sm font-bold px-1 min-h-[44px]">↑</button>
                    <button onClick={() => move(i, 1)} disabled={i === videos.length - 1} className="text-gray-300 hover:text-black disabled:opacity-20 text-sm font-bold px-1 min-h-[44px]">↓</button>
                    <button onClick={() => remove(i)} className="text-[10px] text-red-500 uppercase tracking-[2px] font-black border border-red-200 px-3 py-1.5 min-h-[44px] rounded hover:bg-red-50 transition-colors">✕</button>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1 block">VIDEO URL OR UPLOAD</label>
                  <div className="flex gap-2 items-center">
                    <input value={v.url} onChange={(e) => update(i, "url", e.target.value)} className="admin-input text-sm flex-1" placeholder="YouTube, Vimeo, .mp4, or Instagram link" />
                    {/instagram\.com\/(?:p|reel|tv)\//.test(v.url) && (
                      <button
                        onClick={() => downloadIg(i, v.url)}
                        disabled={downloading[v.id]}
                        className="shrink-0 text-[9px] uppercase tracking-[2px] font-bold bg-[#b3a384] text-white px-3 py-2 rounded hover:bg-[#9a8b6e] disabled:opacity-50 transition-colors whitespace-nowrap min-h-[44px]"
                      >
                        {downloading[v.id] ? 'Downloading…' : '⬇ Save to site'}
                      </button>
                    )}
                    <input
                      ref={el => { fileInputRefs.current[v.id] = el; }}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(i, f); e.target.value = ''; }}
                    />
                    <button
                      onClick={() => fileInputRefs.current[v.id]?.click()}
                      disabled={uploading[v.id]}
                      className="shrink-0 text-[9px] uppercase tracking-[2px] font-bold border border-[#b3a384] text-[#b3a384] px-3 py-2 rounded hover:bg-[#b3a384] hover:text-white disabled:opacity-50 transition-colors whitespace-nowrap min-h-[44px]"
                    >
                      {uploading[v.id] ? 'Uploading…' : '↑ Upload'}
                    </button>
                  </div>
                  {/instagram\.com\/(?:p|reel|tv)\//.test(v.url) && !downloading[v.id] && (
                    <p className="text-[9px] text-[#b3a384] mt-1">Instagram link detected — click &quot;Save to site&quot; to download it, or use &quot;Upload&quot; to upload a video file directly</p>
                  )}
                  {!v.url && (
                    <p className="text-[9px] text-gray-400 mt-1">Paste a link above, or click &quot;Upload&quot; to upload an MP4 from your device</p>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1 block">TITLE (optional)</label>
                <input value={v.title} onChange={(e) => update(i, "title", e.target.value)} className="admin-input text-sm" placeholder="Video title" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1 block">CLIENT NAME</label>
                <input value={v.clientName} onChange={(e) => update(i, "clientName", e.target.value)} className="admin-input text-sm" placeholder="e.g. Sara" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-1 block">CLIENT SUBTITLE</label>
                <input value={v.clientSubtitle} onChange={(e) => update(i, "clientSubtitle", e.target.value)} className="admin-input text-sm" placeholder="e.g. Bride, Cairo" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Year Collection Editor ──────────────
const ALL_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];

function YearCollectionEditor({
  sectionKey,
  years,
  allImages,
  onChange,
  onUploadComplete,
}: {
  sectionKey: "bridal" | "couture";
  years: Record<string, CategoryYear>;
  allImages: string[];
  onChange: (years: Record<string, CategoryYear>) => void;
  onUploadComplete?: () => void;
}) {
  const existingYears = ALL_YEARS.filter((y) => y in years);
  const addableYears = ALL_YEARS.filter((y) => !(y in years));
  const [activeYear, setActiveYear] = useState<string | null>(existingYears[0] ?? null);
  const [pickerCollIdx, setPickerCollIdx] = useState<number | null>(null);

  // If years change externally and active year is gone, reset
  useEffect(() => {
    if (activeYear && !(activeYear in years)) {
      const remaining = ALL_YEARS.filter((y) => y in years);
      setActiveYear(remaining[0] ?? null);
    }
  }, [years, activeYear]);

  const addYear = (y: string) => {
    const updated = { ...years, [y]: { collections: [] } };
    onChange(updated);
    setActiveYear(y);
  };

  const deleteYear = (y: string) => {
    if (!window.confirm(`Delete ${y.toUpperCase()} and all its collections?`)) return;
    const updated = { ...years };
    delete updated[y];
    onChange(updated);
    const remaining = ALL_YEARS.filter((yr) => yr in updated);
    setActiveYear(remaining[0] ?? null);
  };

  const addCollection = () => {
    if (!activeYear) return;
    const existing = years[activeYear]?.collections ?? [];
    const newId = `coll-${Date.now()}`;
    const updated = {
      ...years,
      [activeYear]: { collections: [{ id: newId, name: "", images: [] }, ...existing] },
    };
    onChange(updated);
  };

  const moveCollection = (collIdx: number, dir: -1 | 1) => {
    if (!activeYear) return;
    const existing = [...(years[activeYear]?.collections ?? [])];
    const newIdx = collIdx + dir;
    if (newIdx < 0 || newIdx >= existing.length) return;
    [existing[collIdx], existing[newIdx]] = [existing[newIdx], existing[collIdx]];
    const updated = { ...years, [activeYear]: { collections: existing } };
    onChange(updated);
  };

  const updateCollectionName = (collIdx: number, name: string) => {
    if (!activeYear) return;
    const existing = years[activeYear]?.collections ?? [];
    const updatedCollections = existing.map((c, i) =>
      i === collIdx ? { ...c, name } : c
    );
    const updated = { ...years, [activeYear]: { collections: updatedCollections } };
    onChange(updated);
  };

  const deleteCollection = (collIdx: number) => {
    if (!activeYear) return;
    if (!window.confirm(`Delete Collection ${collIdx + 1}?`)) return;
    const existing = years[activeYear]?.collections ?? [];
    const updated = {
      ...years,
      [activeYear]: { collections: existing.filter((_, i) => i !== collIdx) },
    };
    onChange(updated);
  };

  const addImagesToCollection = (collIdx: number, srcs: string[]) => {
    if (!activeYear) return;
    const existing = years[activeYear]?.collections ?? [];
    const coll = existing[collIdx];
    const updatedCollections = existing.map((c, i) =>
      i === collIdx ? { ...c, images: [...c.images, ...srcs] } : c
    );
    const updated = { ...years, [activeYear]: { collections: updatedCollections } };
    onChange(updated);
    setPickerCollIdx(null);
    void coll;
  };

  const removeImageFromCollection = (collIdx: number, imgIdx: number) => {
    if (!activeYear) return;
    const existing = years[activeYear]?.collections ?? [];
    const updatedCollections = existing.map((c, i) =>
      i === collIdx ? { ...c, images: c.images.filter((_, ii) => ii !== imgIdx) } : c
    );
    const updated = { ...years, [activeYear]: { collections: updatedCollections } };
    onChange(updated);
  };

  const activeCollections = activeYear ? (years[activeYear]?.collections ?? []) : [];

  return (
    <div className="space-y-8">
      {/* Year tabs row */}
      <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-2 border-b border-gray-100">
        {existingYears.map((y) => (
          <button
            key={y}
            onClick={() => setActiveYear(y)}
            className={`min-h-[44px] px-5 py-2 text-[10px] tracking-[2px] uppercase font-black rounded transition-all shrink-0 ${activeYear === y ? "bg-black text-white shadow" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black"}`}
          >
            {y}
          </button>
        ))}
        {addableYears.length > 0 && (
          <select
            onChange={(e) => { if (e.target.value) addYear(e.target.value); e.target.value = ""; }}
            defaultValue=""
            className="min-h-[44px] px-4 py-2 text-[10px] tracking-[2px] uppercase font-black bg-white border-2 border-dashed border-gray-300 rounded text-gray-400 hover:border-black transition-colors cursor-pointer shrink-0"
          >
            <option value="" disabled>+ Add Year</option>
            {addableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* No year selected */}
      {!activeYear && (
        <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs uppercase tracking-widest">
          Select or add a year to get started
        </div>
      )}

      {activeYear && (
        <div className="space-y-8">
          {/* Active year header */}
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl uppercase tracking-[3px] text-black">
              {sectionKey === "bridal" ? "Bridal" : "Couture"} {activeYear}
            </h3>
            <button
              onClick={() => deleteYear(activeYear)}
              className="text-[10px] text-red-500 uppercase tracking-[2px] font-black border border-red-200 px-4 py-2 min-h-[44px] rounded hover:bg-red-50 transition-colors"
            >
              Delete Year
            </button>
          </div>

          {/* Collections */}
          {activeCollections.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs uppercase tracking-widest">
              No collections yet — add one below
            </div>
          )}

          {activeCollections.map((coll, collIdx) => (
            <div key={coll.id} className="border border-gray-100 rounded-lg p-5 sm:p-6 space-y-4 bg-white shadow-sm">
              {/* Design header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] uppercase tracking-[3px] font-black text-gray-500">
                    Design {collIdx + 1}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveCollection(collIdx, -1)}
                      disabled={collIdx === 0}
                      title="Move Up"
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-xs font-bold"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCollection(collIdx, 1)}
                      disabled={collIdx === activeCollections.length - 1}
                      title="Move Down"
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-xs font-bold"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => deleteCollection(collIdx)}
                  className="text-[10px] text-red-500 uppercase tracking-[2px] font-black border border-red-200 px-4 py-2 min-h-[44px] rounded hover:bg-red-50 transition-colors"
                >
                  ✕ Delete Design
                </button>
              </div>

              {/* Design name */}
              <div>
                <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-2">
                  Design Name <span className="text-gray-300">(shown on the page)</span>
                </label>
                <input
                  type="text"
                  value={coll.name ?? ""}
                  onChange={(e) => updateCollectionName(collIdx, e.target.value)}
                  placeholder="e.g. Spring Garden 2026"
                  className="admin-input text-base"
                />
              </div>

              {/* Thumbnail grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {coll.images.map((src, imgIdx) => (
                  <div key={src + imgIdx} className="relative group aspect-[3/4] bg-gray-100 rounded overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getThumb(src)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { const el = e.currentTarget; el.style.display = 'none'; const p = el.parentElement; if (p && !p.querySelector('.error-msg')) { const d = document.createElement('div'); d.className = 'error-msg w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 text-center p-1'; d.innerHTML = '<span class="text-base">⚠️</span><span class="text-[7px] font-bold mt-0.5 uppercase">Broken</span>'; p.appendChild(d); } }}
                    />
                    <button
                      title="Remove"
                      onClick={() => removeImageFromCollection(collIdx, imgIdx)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full opacity-100 z-10 shadow-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {coll.images.length === 0 && (
                  <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs uppercase tracking-widest">
                    No images
                  </div>
                )}
              </div>

              {/* Add Images button */}
              <button
                onClick={() => setPickerCollIdx(collIdx)}
                className="min-h-[44px] px-6 py-2 bg-black text-white text-[10px] tracking-[2px] uppercase font-bold hover:bg-[#333] transition-colors rounded shadow-sm"
              >
                + Add Design Images
              </button>

              {/* Image Picker modal for this collection */}
              {pickerCollIdx === collIdx && (
                <ImagePicker
                  allImages={allImages}
                  onSelect={(srcs) => addImagesToCollection(collIdx, srcs)}
                  onUploadComplete={onUploadComplete}
                  onClose={() => setPickerCollIdx(null)}
                  multi={true}
                />
              )}
            </div>
          ))}

          {/* New Design button */}
          <button
            onClick={addCollection}
            className="w-full min-h-[56px] border-2 border-dashed border-gray-200 rounded text-[10px] uppercase tracking-[3px] font-black text-gray-400 hover:border-black hover:text-black transition-colors"
          >
            + New Design
          </button>
        </div>
      )}
    </div>
  );
}

// ── Client Form Modal ───────────────────
function ClientForm({
  initial,
  existingClients,
  onSave,
  onClose,
}: {
  initial?: Partial<Client>;
  existingClients: Client[];
  onSave: (data: Partial<Client>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [totalPrice, setTotalPrice] = useState(String(initial?.totalPrice ?? ""));
  const [appointmentDate, setAppointmentDate] = useState(initial?.appointmentDate ?? "");
  const [appointmentTime, setAppointmentTime] = useState(initial?.appointmentTime ?? "");
  const [fittingDate, setFittingDate] = useState(initial?.fittingDate ?? "");
  const [fittingTime, setFittingTime] = useState(initial?.fittingTime ?? "");
  const [nextAppointmentDate, setNextAppointmentDate] = useState(initial?.nextAppointmentDate ?? "");
  const [eventDate, setEventDate] = useState(initial?.eventDate ?? "");
  const [dressType, setDressType] = useState<Client["dressType"]>(initial?.dressType ?? "");
  const [branch, setBranch] = useState<Client["branch"]>(initial?.branch ?? "");
  const [clientImages, setClientImages] = useState<string[]>(initial?.clientImages ?? []);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);
  const [status, setStatus] = useState<Client["status"]>(initial?.status ?? "pending");
  const [saving, setSaving] = useState(false);

  const dupClient = phone.trim()
    ? existingClients.find(c => c.id !== initial?.id && (c.phone ?? "").replace(/\D/g, "") === phone.replace(/\D/g, "") && phone.replace(/\D/g, "").length >= 7)
    : null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const total = files.length;
    const uploaded: string[] = [];
    for (let i = 0; i < total; i++) {
      const file = files[i];
      setImageUploadStatus(`Uploading ${i + 1}/${total}...`);
      const fd = new FormData();
      fd.append("files", file, file.name);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        const urls: string[] = data.uploaded ?? [];
        uploaded.push(...urls);
      }
    }
    setClientImages(prev => [...prev, ...uploaded]);
    setImageUploadStatus(null);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dupClient) return;
    setSaving(true);
    try {
      await onSave({ name, email, phone, notes, totalPrice: Number(totalPrice) || 0, appointmentDate, appointmentTime, fittingDate, fittingTime, nextAppointmentDate, eventDate, dressType, branch, clientImages, status });
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="sm:col-span-2 flex items-center gap-3 pt-1">
      <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400 shrink-0">{label}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#2a2218]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="font-display text-base uppercase tracking-[4px]">
            {initial?.id ? "Edit Client" : "New Client"}
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-2xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ── Client Info ── */}
            <SectionHeader label="Client Info" />

            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">
                Mobile Number <span className="text-rose-400">*</span> <span className="text-gray-300 normal-case tracking-normal font-normal">— used as unique ID</span>
              </label>
              <input
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={`admin-input text-lg font-bold tracking-wide ${dupClient ? "border-amber-400 focus:border-amber-500" : ""}`}
                placeholder="01xxxxxxxxx"
                inputMode="tel"
              />
              {dupClient && (
                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <span className="text-amber-500 text-base shrink-0">⚠️</span>
                  <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                    Already registered as <span className="underline">{dupClient.name || dupClient.id}</span>. Each mobile number can only have one profile.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">
                Client Name <span className="text-rose-400">*</span> <span className="text-[#b3a384] normal-case tracking-normal font-normal">— بالعربي</span>
              </label>
              <input
                required
                dir="rtl"
                lang="ar"
                value={name}
                onChange={e => setName(e.target.value)}
                className="admin-input text-right"
                placeholder="الاسم بالعربي"
              />
              {/[a-zA-Z]/.test(name) && (
                <p className="mt-1.5 text-[10px] text-red-500 font-bold">⚠️ الاسم يجب أن يكون بالعربي</p>
              )}
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Total Price <span className="text-gray-300 font-normal normal-case tracking-normal">(EGP)</span></label>
              <input type="number" min="0" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} className="admin-input" placeholder="0" />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Dress Type</label>
              <select value={dressType} onChange={e => setDressType(e.target.value as Client["dressType"])} className="admin-input">
                <option value="">— Select —</option>
                <option value="wedding">Wedding Dress</option>
                <option value="evening">Evening Dress</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Branch</label>
              <select value={branch} onChange={e => setBranch(e.target.value as Client["branch"])} className="admin-input">
                <option value="">— Select —</option>
                <option value="cairo">Cairo</option>
                <option value="damietta">Damietta</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Client["status"])} className="admin-input">
                <option value="pending">New / Pending</option>
                <option value="active">Active — in progress</option>
                <option value="completed">Completed — fully paid</option>
              </select>
            </div>

            {/* ── Appointments ── */}
            <SectionHeader label="Appointments" />

            {/* 1st Appointment */}
            <div className="sm:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-[9px] uppercase tracking-[2px] font-black text-blue-500 mb-2.5">1st Appointment <span className="font-normal normal-case tracking-normal text-blue-400">— first visit / consultation</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-[2px] font-bold text-blue-400 block mb-1">Date</label>
                  <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="admin-input text-sm" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-[2px] font-bold text-blue-400 block mb-1">Time <span className="font-normal normal-case tracking-normal text-blue-300">(optional)</span></label>
                  <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="admin-input text-sm" />
                </div>
              </div>
            </div>

            {/* Fitting Appointment */}
            <div className="sm:col-span-2 bg-rose-50 border border-rose-100 rounded-xl p-3">
              <p className="text-[9px] uppercase tracking-[2px] font-black text-rose-500 mb-2.5">Fitting Appointment <span className="font-normal normal-case tracking-normal text-rose-400">— dress fitting session</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-[2px] font-bold text-rose-400 block mb-1">Date</label>
                  <input type="date" value={fittingDate} onChange={e => setFittingDate(e.target.value)} className="admin-input text-sm" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-[2px] font-bold text-rose-400 block mb-1">Time <span className="font-normal normal-case tracking-normal text-rose-300">(optional)</span></label>
                  <input type="time" value={fittingTime} onChange={e => setFittingTime(e.target.value)} className="admin-input text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Next Appointment <span className="font-normal normal-case tracking-normal text-gray-300">— follow-up date</span></label>
              <input type="date" value={nextAppointmentDate} onChange={e => setNextAppointmentDate(e.target.value)} className="admin-input" />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Event Date <span className="font-normal normal-case tracking-normal text-gray-300">— wedding / occasion</span></label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="admin-input" />
            </div>

            {/* ── Notes & Media ── */}
            <SectionHeader label="Notes & Media" />

            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Client Photos <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span></label>
              <label className="flex items-center justify-center gap-2 w-full min-h-[48px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#b3a384] transition-colors text-[10px] uppercase tracking-[2px] font-bold text-gray-400 hover:text-[#b3a384]">
                <span>📷</span>
                <span>{imageUploadStatus ?? "Tap to upload photos"}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={!!imageUploadStatus} />
              </label>
              {clientImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {clientImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-100" onError={(e) => { e.currentTarget.style.opacity = '0.3'; }} />
                      <button type="button" onClick={() => setClientImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Email <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="admin-input" placeholder="client@email.com" />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Notes <span className="text-gray-300 normal-case tracking-normal font-normal">— ملاحظات (اختياري)</span></label>
              <textarea
                dir="rtl"
                lang="ar"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="admin-input resize-none text-right"
                placeholder="مثال: تفضل اللون العاجي، مقاس ٣٨..."
              />
            </div>

          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[10px] uppercase tracking-[2px] font-black text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={saving || !!dupClient || /[a-zA-Z]/.test(name)} className="flex-1 min-h-[48px] bg-black text-white rounded-xl text-[10px] uppercase tracking-[2px] font-black hover:bg-[#b3a384] transition-all disabled:opacity-40">
              {saving ? "Saving..." : initial?.id ? "Save Changes" : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Payment Modal ────────────────────
function AddPaymentModal({
  onSave,
  onClose,
}: {
  onSave: (amount: number, date: string, note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    await onSave(Number(amount), date, note);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-[#2a2218]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="font-display text-sm uppercase tracking-[4px]">Add Payment</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-2xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Amount Paid (EGP) *</label>
            <input type="number" min="1" required value={amount} onChange={e => setAmount(e.target.value)} className="admin-input text-lg font-bold" placeholder="0" autoFocus />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Visit Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="admin-input" placeholder="e.g. First fitting" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[10px] uppercase tracking-[2px] font-black text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 min-h-[48px] bg-[#b3a384] text-white rounded-xl text-[10px] uppercase tracking-[2px] font-black hover:bg-black transition-all disabled:opacity-40">
              {saving ? "Saving..." : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Payment Modal ────────────────────
function EditPaymentModal({
  payment,
  onSave,
  onClose,
}: {
  payment: Payment;
  onSave: (amount: number, date: string, note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [date, setDate] = useState(payment.date);
  const [note, setNote] = useState(payment.note);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    await onSave(Number(amount), date, note);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-[#2a2218]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="font-display text-sm uppercase tracking-[4px]">Edit Payment</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-2xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Amount Paid (EGP) *</label>
            <input type="number" min="1" required value={amount} onChange={e => setAmount(e.target.value)} className="admin-input text-lg font-bold" placeholder="0" autoFocus />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="admin-input" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Visit Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="admin-input" placeholder="e.g. First fitting" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[10px] uppercase tracking-[2px] font-black text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 min-h-[48px] bg-[#b3a384] text-white rounded-xl text-[10px] uppercase tracking-[2px] font-black hover:bg-black transition-all disabled:opacity-40">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Clients Panel ────────────────────────
// ── Fitting Appointment Modal ────────────
function FittingModal({
  currentDate,
  currentTime,
  onSave,
  onClose,
}: {
  currentDate: string;
  currentTime: string;
  onSave: (date: string, time: string) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(currentDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(currentTime || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    await onSave(date, time);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-[#2a2218]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="font-display text-sm uppercase tracking-[4px]">Fitting Appointment</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-2xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Fitting Date *</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="admin-input text-base font-bold" autoFocus />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Fitting Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="admin-input text-base font-bold" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] border border-gray-200 rounded-xl text-[10px] uppercase tracking-[2px] font-black text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 min-h-[48px] bg-rose-500 text-white rounded-xl text-[10px] uppercase tracking-[2px] font-black hover:bg-rose-600 transition-all disabled:opacity-40">
              {saving ? "Saving..." : "Confirm Fitting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Admin Voice Note Player ───────────────
function AdminVoiceNotePlayer({ note, onDelete }: { note: VoiceNote; onDelete?: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fmt = (s: number) => isFinite(s) && s > 0
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
    : "—";

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  const isAtelier = note.from === "atelier";

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isAtelier ? "bg-[#faf9f7] border border-[#e8dfd4]" : "bg-indigo-50 border border-indigo-100"}`}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={note.url}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={e => {
          const a = e.target as HTMLAudioElement;
          if (a.duration) setProgress((a.currentTime / a.duration) * 100);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); if (audioRef.current) audioRef.current.currentTime = 0; }}
      />
      <button
        onClick={toggle}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 ${isAtelier ? "bg-[#b3a384] text-white" : "bg-indigo-500 text-white"}`}
      >
        {playing ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-white rounded-full overflow-hidden border border-gray-100 mb-1.5">
          <div
            className={`h-full rounded-full transition-all duration-100 ${isAtelier ? "bg-[#b3a384]" : "bg-indigo-400"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] uppercase tracking-[1px] font-black ${isAtelier ? "text-[#b3a384]" : "text-indigo-400"}`}>
            {isAtelier ? "From Atelier" : "Admin Reply"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-300">{fmt(duration)}</span>
            <span className="text-[9px] text-gray-300">
              {new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="shrink-0 text-gray-200 hover:text-red-400 transition-colors text-sm leading-none font-bold">✕</button>
      )}
    </div>
  );
}

// ── Admin Voice Recorder ──────────────────
function AdminVoiceRecorder({ onSave }: { onSave: (url: string) => Promise<void> }) {
  const [state, setState] = useState<"idle" | "recording" | "uploading">("idle");
  const [secs, setSecs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
        .find(t => MediaRecorder.isTypeSupported(t)) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const mime = recorder.mimeType || "audio/webm";
        const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        setState("uploading");
        try {
          const fd = new FormData();
          fd.append("file", blob, `voice.${ext}`);
          const res = await fetch("/api/upload/voice", { method: "POST", body: fd });
          if (!res.ok) throw new Error();
          const { url } = await res.json();
          await onSave(url);
        } catch {
          alert("Failed to upload voice note — please try again");
        } finally {
          setState("idle");
          setSecs(0);
        }
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setState("recording");
      setSecs(0);
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000);
    } catch {
      alert("Could not access microphone — please allow permission");
    }
  };

  const stop = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.stop();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (state === "uploading") {
    return (
      <div className="flex items-center gap-2 text-[10px] text-gray-400 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span>Uploading...</span>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-xs font-black text-red-600 tabular-nums">{fmt(secs)}</span>
        <button
          onClick={stop}
          className="min-h-[40px] px-4 py-2 bg-red-500 text-white rounded-lg text-[10px] uppercase tracking-[2px] font-black hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          Stop
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      className="flex items-center gap-2 min-h-[40px] px-4 py-2 border border-dashed border-indigo-200 text-indigo-400 hover:bg-indigo-50 rounded-lg text-[10px] uppercase tracking-[2px] font-black transition-all"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </svg>
      Record Reply
    </button>
  );
}

// ── Dress Label Input ─────────────────────
// Saves only on blur to avoid one API call per keypress
function DressLabelInput({ value, onSave }: { value: string; onSave: (label: string) => void }) {
  const [label, setLabel] = useState(value);
  useEffect(() => { setLabel(value); }, [value]);
  return (
    <input
      type="text"
      value={label}
      onChange={e => setLabel(e.target.value)}
      onBlur={() => { if (label !== value) onSave(label); }}
      placeholder="Add a label (e.g. Wedding Dress)"
      className="flex-1 text-xs border-0 border-b border-gray-100 focus:border-[#b3a384] focus:outline-none bg-transparent py-1 text-stone-600 placeholder:text-gray-300 transition-colors"
    />
  );
}

// ── Fitting Calendar ─────────────────────
function FittingCalendar({ clients, onRefresh }: { clients: Client[]; onRefresh: () => void }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"first" | "fitting">("fitting");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = setInterval(onRefresh, 30_000);
    return () => clearInterval(id);
  }, [onRefresh]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  type CalEntry = { client: Client; type: "first" | "fitting"; time: string };
  const dayMap = new Map<string, CalEntry[]>();
  clients.forEach(c => {
    if (c.fittingDate) {
      const key = c.fittingDate.slice(0, 10);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push({ client: c, type: "fitting", time: c.fittingTime ?? "" });
    }
    if (c.appointmentDate) {
      const key = c.appointmentDate.slice(0, 10);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push({ client: c, type: "first", time: c.appointmentTime ?? "" });
    }
  });
  dayMap.forEach(arr => arr.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  const prevMonth = () => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); setEditingId(null); };
  const nextMonth = () => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); setEditingId(null); };

  const monthLabel = viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const todayStr = today.toISOString().slice(0, 10);

  const openEdit = (c: Client, type: "first" | "fitting") => {
    setEditingId(c.id + "_" + type);
    setEditType(type);
    if (type === "fitting") {
      setEditDate(c.fittingDate?.slice(0, 10) ?? "");
      setEditTime(c.fittingTime ?? "");
    } else {
      setEditDate(c.appointmentDate?.slice(0, 10) ?? "");
      setEditTime(c.appointmentTime ?? "");
    }
  };

  const handleSaveEdit = async (clientId: string) => {
    if (!editDate) return;
    setSaving(true);
    const body = editType === "fitting"
      ? { id: clientId, fittingDate: editDate, fittingTime: editTime }
      : { id: clientId, appointmentDate: editDate, appointmentTime: editTime };
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setEditingId(null);
    setSelectedDay(editDate);
    onRefresh();
  };

  const selectedEntries = selectedDay ? (dayMap.get(selectedDay) ?? []) : [];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-[3px] font-black text-gray-800">{monthLabel}</p>
          <p className="text-[10px] text-gray-400 font-bold tracking-[1px]">APPOINTMENTS SCHEDULE</p>
        </div>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-5 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          <span className="text-[10px] font-black uppercase tracking-[1px] text-gray-500">1st Appt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
          <span className="text-[10px] font-black uppercase tracking-[1px] text-gray-500">Fitting</span>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="py-1.5 text-center text-[10px] uppercase tracking-[1px] font-black text-gray-400">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - firstDow + 1;
          if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} className="aspect-square" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const entries = dayMap.get(dateStr) ?? [];
          const hasFirst = entries.some(e => e.type === "first");
          const hasFitting = entries.some(e => e.type === "fitting");
          const hasAny = entries.length > 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          return (
            <button
              key={i}
              onClick={() => { setSelectedDay(isSelected ? null : dateStr); setEditingId(null); }}
              disabled={!hasAny}
              className={`
                aspect-square flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all border border-transparent
                ${hasAny ? "cursor-pointer" : "cursor-default text-gray-300"}
                ${isSelected ? "bg-stone-800 text-white rounded-lg" : ""}
                ${hasAny && !isSelected ? "bg-stone-50 text-stone-700 hover:border-stone-300" : ""}
                ${isToday && !isSelected ? "ring-2 ring-inset ring-[#b3a384]" : ""}
              `}
            >
              <span className={`text-[13px] leading-none ${isSelected ? "font-black" : ""}`}>{dayNum}</span>
              {hasAny && (
                <div className="flex gap-0.5">
                  {hasFirst && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-300" : "bg-blue-400"}`} />}
                  {hasFitting && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-rose-300" : "bg-rose-400"}`} />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="border-t border-gray-100 bg-stone-50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[2px] font-black text-gray-400 mb-3">
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="space-y-2">
            {selectedEntries.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No appointments on this day</p>
            ) : selectedEntries.map((entry, idx) => {
              const c = entry.client;
              const editKey = c.id + "_" + entry.type;
              const isEditing = editingId === editKey;
              const isFitting = entry.type === "fitting";
              return (
                <div key={`${c.id}_${entry.type}_${idx}`} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      {c.name && <p className="text-[13px] font-black text-gray-800 truncate">{c.name}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] text-gray-400 font-bold" dir="ltr">{c.phone}</p>
                        {entry.time && (
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${isFitting ? "text-rose-500 bg-rose-50 border-rose-100" : "text-blue-500 bg-blue-50 border-blue-100"}`}>
                            {to12h(entry.time)}
                          </span>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-[1px] px-2 py-0.5 rounded-full ${isFitting ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                          {isFitting ? "FITTING" : "1ST APPT"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => isEditing ? setEditingId(null) : openEdit(c, entry.type)}
                        className="flex items-center gap-1 text-[11px] font-black tracking-[1px] uppercase px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                      <a
                        href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-[#25D366] text-white text-[11px] font-black tracking-[1px] uppercase px-3 py-2 rounded-lg hover:bg-[#1ebe5d] transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  {isEditing && (
                    <div className={`border-t px-3 py-3 space-y-2 ${isFitting ? "border-rose-100 bg-rose-50/60" : "border-blue-100 bg-blue-50/60"}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={`text-[9px] uppercase tracking-[2px] font-black block mb-1 ${isFitting ? "text-rose-400" : "text-blue-400"}`}>Date</label>
                          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none bg-white ${isFitting ? "border-rose-200 focus:border-rose-400" : "border-blue-200 focus:border-blue-400"}`}
                          />
                        </div>
                        <div>
                          <label className={`text-[9px] uppercase tracking-[2px] font-black block mb-1 ${isFitting ? "text-rose-400" : "text-blue-400"}`}>Time</label>
                          <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none bg-white ${isFitting ? "border-rose-200 focus:border-rose-400" : "border-blue-200 focus:border-blue-400"}`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 min-h-[36px] border border-gray-200 rounded-lg text-[10px] uppercase tracking-[1px] font-black text-gray-400 hover:bg-gray-50 transition-all"
                        >
                          Cancel
                        </button>
                        <button onClick={() => handleSaveEdit(c.id)} disabled={saving || !editDate}
                          className={`flex-1 min-h-[36px] text-white rounded-lg text-[10px] uppercase tracking-[1px] font-black transition-all disabled:opacity-40 ${isFitting ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-500 hover:bg-blue-600"}`}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upcoming Appointments ─────────────────────
function UpcomingAppointments({ clients }: { clients: Client[] }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  type ApptEntry = { date: string; time: string; name: string; phone: string; type: "first" | "fitting" };
  const entries: ApptEntry[] = [];
  clients.forEach(c => {
    if (c.appointmentDate && c.appointmentDate.slice(0, 10) >= todayStr)
      entries.push({ date: c.appointmentDate.slice(0, 10), time: c.appointmentTime ?? "", name: c.name, phone: c.phone, type: "first" });
    if (c.fittingDate && c.fittingDate.slice(0, 10) >= todayStr)
      entries.push({ date: c.fittingDate.slice(0, 10), time: c.fittingTime ?? "", name: c.name, phone: c.phone, type: "fitting" });
  });
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const upcoming = entries.slice(0, 10);
  if (upcoming.length === 0) return null;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-[11px] uppercase tracking-[3px] font-black text-gray-800">Upcoming Appointments</p>
      </div>
      <div className="divide-y divide-gray-50">
        {upcoming.map((e, i) => (
          <div key={`${e.phone}_${e.type}_${i}`} className="flex items-center gap-3 px-4 py-2.5">
            <div className="shrink-0 text-center w-10">
              <p className="text-[14px] font-black text-gray-800 leading-none">{new Date(e.date + "T12:00:00").getDate()}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase">{new Date(e.date + "T12:00:00").toLocaleDateString("en-GB", { month: "short" })}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] font-black text-gray-800 truncate">{e.name || e.phone}</p>
                <span className={`text-[9px] font-black uppercase tracking-[1px] px-1.5 py-0.5 rounded ${e.type === "fitting" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                  {e.type === "fitting" ? "FITTING" : "1ST APPT"}
                </span>
              </div>
              {e.time && <p className="text-[11px] text-gray-400 font-bold">{to12h(e.time)}</p>}
            </div>
            <a href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
              className="shrink-0 flex items-center gap-1 bg-[#25D366] text-white text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg hover:bg-[#1ebe5d] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WA
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Clients Panel ────────────────────────
function ClientsPanel({
  clients,
  allImages,
  onRefresh,
  onUploadComplete,
}: {
  clients: Client[];
  allImages: string[];
  onRefresh: () => void;
  onUploadComplete: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "pending">("all");
  const [monthFilter, setMonthFilter] = useState("");

  // Auto-refresh client data every 30 seconds
  useEffect(() => {
    const id = setInterval(onRefresh, 30_000);
    return () => clearInterval(id);
  }, [onRefresh]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<{ clientId: string; payment: Payment } | null>(null);
  const [fittingClientId, setFittingClientId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dressPickerInfo, setDressPickerInfo] = useState<{ clientId: string; dressId: string } | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const statusColor = (s: Client["status"]) =>
    s === "active" ? "bg-green-100 text-green-700" :
    s === "completed" ? "bg-blue-100 text-blue-700" :
    "bg-amber-100 text-amber-700";

  // Month dropdown built from event dates (not registration dates)
  const monthOptions = Array.from(
    new Set(clients.filter(c => c.eventDate).map(c => c.eventDate.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a)).map(key => ({
    key,
    label: new Date(key + "-15").toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  }));

  // Context: month + search filter only — status tabs/counts/totals all reflect this
  const contextFiltered = clients.filter(c => {
    const q = search.replace(/\D/g, "");
    const matchesSearch = !q || (c.phone ?? "").replace(/\D/g, "").includes(q);
    const matchesMonth = !monthFilter || (c.eventDate && c.eventDate.startsWith(monthFilter));
    return matchesSearch && matchesMonth;
  });

  const statusCounts = {
    active: contextFiltered.filter(c => c.status === "active").length,
    pending: contextFiltered.filter(c => c.status === "pending").length,
    completed: contextFiltered.filter(c => c.status === "completed").length,
  };

  const totalCollected = contextFiltered.reduce((s, c) => s + clientPaid(c), 0);
  const totalRemaining = contextFiltered.reduce((s, c) => s + clientRemaining(c), 0);

  // Final list: context + status filter applied on top
  const filtered = contextFiltered.filter(c => filter === "all" || c.status === filter);

  const handleCreate = async (data: Partial<Client>) => {
    const res = await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to create client");
      return;
    }
    onRefresh();
    setFormOpen(false);
  };

  const handleUpdate = async (data: Partial<Client>) => {
    if (!editClient) return;
    const res = await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editClient.id, ...data }) });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to update client");
      return;
    }
    onRefresh();
    setEditClient(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this client permanently?")) return;
    setDeletingId(id);
    await fetch("/api/admin/clients", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    onRefresh();
    setDeletingId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const handleAddPayment = async (clientId: string, amount: number, date: string, note: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "addPayment", amount, date, note }) });
    onRefresh();
    setPaymentClientId(null);
  };

  const handleDeletePayment = async (clientId: string, paymentId: string) => {
    if (!window.confirm("Remove this payment?")) return;
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "deletePayment", paymentId }) });
    onRefresh();
  };

  const handleEditPayment = async (clientId: string, paymentId: string, amount: number, date: string, note: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "updatePayment", paymentId, amount, date, note }) });
    onRefresh();
    setEditingPayment(null);
  };

  const handleDateChange = async (clientId: string, field: "appointmentDate" | "nextAppointmentDate" | "fittingDate", value: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, [field]: value }) });
    onRefresh();
  };

  const handleFittingUpdate = async (clientId: string, date: string, time: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, fittingDate: date, fittingTime: time }) });
    onRefresh();
  };

  const handleAddDress = async (clientId: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "addDress", label: "" }) });
    onRefresh();
  };

  const handleDeleteDress = async (clientId: string, dressId: string) => {
    if (!window.confirm("Remove this dress and all its photos?")) return;
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "deleteDress", dressId }) });
    onRefresh();
  };

  const handleAddDressImages = async (clientId: string, dressId: string, images: string[]) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "addDressImages", dressId, images }) });
    onRefresh();
    setDressPickerInfo(null);
  };

  const handleRemoveClientImage = async (client: Client, imageUrl: string) => {
    const updated = (client.clientImages ?? []).filter(u => u !== imageUrl);
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: client.id, clientImages: updated }) });
    onRefresh();
  };

  const handleRemoveDressImage = async (clientId: string, dressId: string, imageUrl: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "removeDressImage", dressId, imageUrl }) });
    fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: imageUrl }) }).catch(() => {});
    onRefresh();
  };

  const handleUpdateDressLabel = async (clientId: string, dressId: string, label: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "updateDressLabel", dressId, label }) });
    onRefresh();
  };

  const handleAddVoiceNote = async (clientId: string, url: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "addVoiceNote", url, from: "admin" }) });
    onRefresh();
  };

  const handleDeleteVoiceNote = async (clientId: string, voiceNoteId: string) => {
    if (!window.confirm("Delete this voice note?")) return;
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "deleteVoiceNote", voiceNoteId }) });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar — section title lives in the admin header above, no repeat here */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[2px] font-bold text-gray-400">
          <span className="text-green-600 font-black">EGP {totalCollected.toLocaleString()}</span>
          <span className="mx-1.5 text-gray-300">·</span>
          <span className="text-amber-500 font-black">EGP {totalRemaining.toLocaleString()}</span>
          <span className="ml-0.5 text-gray-400"> remaining</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="text-[10px] font-black uppercase tracking-[2px] px-4 py-2.5 min-h-[44px] border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-all rounded flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            Refresh
          </button>
          <button onClick={() => setFormOpen(true)} className="hidden sm:flex text-[10px] font-black uppercase tracking-[2px] px-5 py-2.5 min-h-[44px] bg-black text-white hover:bg-[#b3a384] transition-all rounded items-center gap-2">
            + New Client
          </button>
        </div>
      </div>

      {/* Fitting Calendar */}
      <FittingCalendar clients={clients} onRefresh={onRefresh} />

      {/* Upcoming Appointments */}
      <UpcomingAppointments clients={clients} />

      {/* Search + Month filter — stacked on mobile, row on sm+ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="tel"
            inputMode="numeric"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by mobile number..."
            className="admin-input pl-11 text-base w-full"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black text-lg font-bold transition-colors">✕</button>
          )}
        </div>
        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="w-full sm:w-44 min-h-[44px] px-3 py-2 border border-gray-200 rounded text-[11px] uppercase tracking-[1px] font-black focus:border-[#b3a384] focus:outline-none bg-white"
        >
          <option value="">Event month</option>
          {monthOptions.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Stats row — tap a card to toggle filter by that status */}
      <div className="grid grid-cols-3 gap-2">
        {(["active", "pending", "completed"] as const).map(s => {
          const isFiltered = filter === s;
          const cfg = {
            active:    { label: "Active",    color: "text-green-600", bg: "bg-green-50 border-green-200" },
            pending:   { label: "Pending",   color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
            completed: { label: "Completed", color: "text-blue-500",  bg: "bg-blue-50 border-blue-200"  },
          }[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(isFiltered ? "all" : s)}
              className={`rounded-xl p-3 sm:p-4 text-center border transition-all active:scale-95 ${isFiltered ? `${cfg.bg} shadow-md` : "bg-white border-gray-100 shadow-sm hover:border-gray-200"}`}
            >
              <p className={`text-xl sm:text-2xl font-black ${cfg.color}`}>{statusCounts[s]}</p>
              <p className={`text-[9px] uppercase tracking-[2px] font-bold mt-0.5 ${isFiltered ? cfg.color : "text-gray-400"}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filter tabs — shrink-0 prevents compression, overflow-x-auto ensures scrollability on tiny screens */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-100 pb-3">
        {(["all", "active", "pending", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 min-h-[40px] px-4 py-2 text-[10px] tracking-[2px] uppercase font-black rounded-full transition-all active:scale-95 ${filter === f ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black"}`}>
            {f === "all" ? `All (${contextFiltered.length})` : `${f} (${statusCounts[f]})`}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs uppercase tracking-[4px] font-bold">
          {search ? `No client found with number "${search}"` : filter === "all" ? "No clients yet — add one above" : `No ${filter} clients`}
        </div>
      )}

      {/* Client list */}
      <div className="space-y-3">
        {filtered.map(client => {
          const paid = clientPaid(client);
          const remaining = clientRemaining(client);
          const pct = client.totalPrice > 0 ? Math.round((paid / client.totalPrice) * 100) : 0;
          const isExpanded = expandedId === client.id;
          const isDeleting = deletingId === client.id;

          return (
            <div key={client.id} className={`rounded-xl border transition-all duration-200 overflow-hidden bg-white ${isExpanded ? "shadow-lg border-gray-200" : "shadow-sm border-gray-100 hover:shadow-md"}`}>
              {/* Collapsed row — phone is primary */}
              <button onClick={() => setExpandedId(isExpanded ? null : client.id)} className="w-full text-left px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4 active:bg-gray-50 transition-colors">
                <span className={`mt-2 shrink-0 w-2 h-2 rounded-full ${client.status === "active" ? "bg-green-500" : client.status === "completed" ? "bg-blue-400" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  {/* Phone number — large and bold, the main identifier */}
                  <p className="text-base font-black text-black tracking-wide mb-0.5">{client.phone || "—"}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-stone-500">{client.name}</span>
                    <span className={`text-[9px] uppercase tracking-[2px] font-black px-2 py-0.5 rounded-full ${statusColor(client.status)}`}>{client.status}</span>
                    {client.dressType && (
                      <span className="text-[9px] uppercase tracking-[2px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500">{client.dressType === "wedding" ? "Wedding" : "Evening"}</span>
                    )}
                    {client.branch && (
                      <span className="text-[9px] uppercase tracking-[2px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">{client.branch === "cairo" ? "Cairo" : "Damietta"}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">
                    EGP {paid.toLocaleString()} paid · EGP {remaining.toLocaleString()} remaining
                  </p>
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                    <div className="h-full bg-[#b3a384] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  {client.nextAppointmentDate && (
                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold">Next: {new Date(client.nextAppointmentDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-1 text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-6 space-y-6 border-t border-gray-100 pt-5">

                  {/* Contact info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Mobile</p>
                      <a href={`tel:${client.phone}`} className="text-base font-black text-stone-800 hover:text-[#b3a384] transition-colors">{client.phone}</a>
                    </div>
                    {client.email && (
                      <div className="bg-gray-50 rounded-lg px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Email</p>
                        <span className="text-sm text-stone-700 break-all">{client.email}</span>
                      </div>
                    )}
                    {client.dressType && (
                      <div className="bg-gray-50 rounded-lg px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Dress Type</p>
                        <span className="text-sm font-bold text-stone-700">{client.dressType === "wedding" ? "Wedding Dress" : "Evening Dress"}</span>
                      </div>
                    )}
                    {client.branch && (
                      <div className="bg-gray-50 rounded-lg px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Branch</p>
                        <span className="text-sm font-bold text-stone-700">{client.branch === "cairo" ? "Cairo" : "Damietta"}</span>
                      </div>
                    )}
                    {client.eventDate && (
                      <div className="bg-gray-50 rounded-lg px-4 py-3">
                        <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Event Date</p>
                        <span className="text-sm font-bold text-stone-700">{new Date(client.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                  {/* Client images */}
                  {(client.clientImages ?? []).length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400 mb-3">Photos</p>
                      <div className="flex flex-wrap gap-2">
                        {(client.clientImages ?? []).map((img, idx) => (
                          <div key={idx} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img} alt=""
                              className="w-20 h-20 object-cover rounded-lg border border-gray-100 cursor-zoom-in"
                              onClick={() => setLightboxSrc(img)}
                              onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveClientImage(client, img)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center z-10 shadow"
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial summary */}
                  <div className="bg-[#faf9f7] border border-[#e8dfd4] rounded-xl p-4">
                    <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400 mb-3">Financial Summary</p>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-[2px] font-bold text-gray-400 mb-0.5">Total</p>
                        <p className="text-sm sm:text-base font-black text-black">EGP {client.totalPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[2px] font-bold text-gray-400 mb-0.5">Paid</p>
                        <p className="text-sm sm:text-base font-black text-green-600">EGP {paid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-[2px] font-bold text-gray-400 mb-0.5">Remaining</p>
                        <p className="text-sm sm:text-base font-black text-amber-600">EGP {remaining.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-[#e8dfd4]">
                      <div className="h-full bg-[#b3a384] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 text-right">{pct}% paid</p>
                  </div>

                  {/* Payments */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400">Payment History</p>
                      <button onClick={() => setPaymentClientId(client.id)} className="text-[10px] font-black uppercase tracking-[2px] text-[#b3a384] hover:text-black transition-colors">+ Add Payment</button>
                    </div>
                    {client.payments.length === 0 ? (
                      <p className="text-xs text-gray-300 italic">No payments recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {client.payments.map(p => (
                          <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-2.5">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-black text-green-600">+EGP {p.amount.toLocaleString()}</span>
                              {p.note && <span className="text-[10px] text-gray-400 ml-2">· {p.note}</span>}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                            <button onClick={() => setEditingPayment({ clientId: client.id, payment: p })} className="text-gray-300 hover:text-[#b3a384] transition-colors shrink-0" title="Edit payment">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => handleDeletePayment(client.id, p.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-black shrink-0">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dresses */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400">Dresses</p>
                      <button onClick={() => handleAddDress(client.id)} className="text-[10px] font-black uppercase tracking-[2px] text-[#b3a384] hover:text-black transition-colors">+ Add Dress</button>
                    </div>
                    {(client.dresses ?? []).length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-xs uppercase tracking-[3px] font-bold">
                        No dress added yet
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {(client.dresses ?? []).map((dress, dressIdx) => (
                          <div key={dress.id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-[9px] uppercase tracking-[3px] font-black text-gray-400 shrink-0">Dress {dressIdx + 1}</span>
                              <DressLabelInput
                                value={dress.label}
                                onSave={(label) => handleUpdateDressLabel(client.id, dress.id, label)}
                              />
                              <button onClick={() => handleDeleteDress(client.id, dress.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-black shrink-0">✕</button>
                            </div>
                            {/* Dress images grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                              {dress.images.map((src) => (
                                <div key={src} className="relative group aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={src} alt=""
                                    className="w-full h-full object-cover cursor-zoom-in"
                                    loading="lazy"
                                    onClick={() => setLightboxSrc(src)}
                                    onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                                  />
                                  <button
                                    onClick={() => handleRemoveDressImage(client.id, dress.id, src)}
                                    className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full opacity-100 z-10 shadow"
                                  >✕</button>
                                </div>
                              ))}
                              {/* Add photos button as last grid item */}
                              <button
                                onClick={() => setDressPickerInfo({ clientId: client.id, dressId: dress.id })}
                                className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-[#b3a384] hover:text-[#b3a384] transition-colors"
                              >
                                <span className="text-xl">+</span>
                                <span className="text-[9px] uppercase tracking-[1px] font-black">Photos</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appointments */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400">Appointments</p>
                      <button
                        onClick={() => setFittingClientId(client.id)}
                        className="text-[9px] uppercase tracking-[2px] font-black text-[#b3a384] hover:text-black transition-colors"
                      >
                        {client.fittingDate ? "✎ Fitting Appointment" : "+ Fitting Appointment"}
                      </button>
                    </div>
                    {client.fittingDate && (
                      <div className="mb-3 bg-rose-50 border border-rose-100 rounded-lg px-4 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] uppercase tracking-[2px] font-black text-rose-400 mb-0.5">Fitting Appointment</p>
                          <p className="text-sm font-bold text-rose-700">
                            {new Date(client.fittingDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            {client.fittingTime && <span className="ml-2 text-rose-400">· {to12h(client.fittingTime)}</span>}
                          </p>
                        </div>
                        <button onClick={() => { handleDateChange(client.id, "fittingDate", ""); handleFittingUpdate(client.id, "", ""); }} className="text-rose-300 hover:text-rose-600 text-lg font-bold transition-colors">✕</button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase tracking-[2px] font-bold text-gray-400 block mb-1">First Appointment</label>
                        <input type="date" value={client.appointmentDate} onChange={e => handleDateChange(client.id, "appointmentDate", e.target.value)} className="admin-input text-sm" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-[2px] font-bold text-gray-400 block mb-1">Next Appointment</label>
                        <input type="date" value={client.nextAppointmentDate} onChange={e => handleDateChange(client.id, "nextAppointmentDate", e.target.value)} className="admin-input text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {client.notes && (
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Notes</p>
                      <p className="text-sm text-stone-600 leading-relaxed">{client.notes}</p>
                    </div>
                  )}

                  {/* Voice Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] uppercase tracking-[3px] font-black text-gray-400">Voice Notes</p>
                      {(client.voiceNotes ?? []).length > 0 && (
                        <span className="text-[9px] text-gray-300 font-bold">{(client.voiceNotes ?? []).length} note{(client.voiceNotes ?? []).length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    <div className="space-y-2 mb-3">
                      {(client.voiceNotes ?? []).length === 0 ? (
                        <p className="text-[10px] text-gray-300 italic">No voice notes yet — atelier can add one from the /atelier page</p>
                      ) : (
                        (client.voiceNotes ?? []).map(note => (
                          <AdminVoiceNotePlayer
                            key={note.id}
                            note={note}
                            onDelete={() => handleDeleteVoiceNote(client.id, note.id)}
                          />
                        ))
                      )}
                    </div>
                    <AdminVoiceRecorder onSave={(url) => handleAddVoiceNote(client.id, url)} />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {client.phone && (
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none min-h-[44px] bg-[#25D366] text-white px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black hover:bg-[#1ebe5d] transition-all text-center flex items-center justify-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                        WhatsApp
                      </a>
                    )}
                    <button onClick={() => setEditClient(client)} className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black border border-gray-200 hover:bg-gray-50 transition-all text-gray-500 flex items-center justify-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit Info
                    </button>
                    <button onClick={() => handleDelete(client.id)} disabled={isDeleting} className="min-h-[44px] px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      {isDeleting ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {formOpen && <ClientForm existingClients={clients} onSave={handleCreate} onClose={() => setFormOpen(false)} />}
      {editClient && <ClientForm initial={editClient} existingClients={clients} onSave={handleUpdate} onClose={() => setEditClient(null)} />}
      {paymentClientId && (
        <AddPaymentModal
          onSave={(amount, date, note) => handleAddPayment(paymentClientId, amount, date, note)}
          onClose={() => setPaymentClientId(null)}
        />
      )}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment.payment}
          onSave={(amount, date, note) => handleEditPayment(editingPayment.clientId, editingPayment.payment.id, amount, date, note)}
          onClose={() => setEditingPayment(null)}
        />
      )}
      {fittingClientId && (
        <FittingModal
          currentDate={clients.find(c => c.id === fittingClientId)?.fittingDate ?? ""}
          currentTime={clients.find(c => c.id === fittingClientId)?.fittingTime ?? ""}
          onSave={async (date, time) => { await handleFittingUpdate(fittingClientId, date, time); setFittingClientId(null); }}
          onClose={() => setFittingClientId(null)}
        />
      )}
      {dressPickerInfo && (
        <ImagePicker
          allImages={allImages}
          multi={true}
          onUploadComplete={onUploadComplete}
          onSelect={(srcs) => handleAddDressImages(dressPickerInfo.clientId, dressPickerInfo.dressId, srcs)}
          onClose={() => setDressPickerInfo(null)}
        />
      )}

      {/* Image lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full text-xl font-bold transition-colors"
          >✕</button>
        </div>
      )}

      {/* Mobile FAB: New Client — bottom-left so it doesn't clash with the Save button (bottom-right) */}
      {!formOpen && !editClient && !paymentClientId && !editingPayment && !fittingClientId && !dressPickerInfo && (
        <button
          onClick={() => setFormOpen(true)}
          className="fixed bottom-6 left-6 z-[40] sm:hidden bg-black text-white px-5 py-3.5 rounded-full shadow-2xl active:scale-95 transition-all font-black text-[11px] tracking-[2px] uppercase flex items-center gap-2 border-2 border-white/10"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
      )}
    </div>
  );
}

// ── Messages Panel ──────────────────────
function MessagesPanel({
  messages,
  onRefresh,
  onDelete,
  onMarkRead,
  onRegisterClient,
}: {
  messages: any[];
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string, read: boolean) => void;
  onRegisterClient: (msg: any) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const unreadCount = messages.filter((m) => !m.read).length;
  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "read") return !!m.read;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    await onMarkRead(id, !currentRead);
  };

  const handleExpand = async (msg: any) => {
    const isOpening = expandedId !== msg.id;
    setExpandedId(isOpening ? msg.id : null);
    if (isOpening && !msg.read) {
      await onMarkRead(msg.id, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display uppercase tracking-widest text-black">Inbox</h3>
            {unreadCount > 0 && (
              <span className="bg-[#b3a384] text-white text-[10px] font-black px-2.5 py-1 rounded-full min-w-[24px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[2px] mt-1 font-bold">
            {messages.length} total · {unreadCount} unread
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-[10px] font-black uppercase tracking-[2px] px-5 py-2.5 min-h-[44px] border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-all rounded flex items-center gap-2"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-4">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-[40px] px-5 py-2 text-[10px] tracking-[2px] uppercase font-black rounded-full transition-all ${
              filter === f ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black"
            }`}
          >
            {f === "all" ? `All (${messages.length})` : f === "unread" ? `Unread (${unreadCount})` : `Read (${messages.length - unreadCount})`}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded text-gray-300 text-xs uppercase tracking-[4px] font-bold">
          {filter === "unread" ? "No unread messages" : filter === "read" ? "No read messages" : "No messages yet"}
        </div>
      )}

      {/* Message list */}
      <div className="space-y-3">
        {filtered.map((msg: any) => {
          const isExpanded = expandedId === msg.id;
          const isDeleting = deletingId === msg.id;
          const date = new Date(msg.createdAt);
          const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

          return (
            <div
              key={msg.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                msg.read ? "bg-white border-gray-100" : "bg-[#fdfcfb] border-[#e8dfd4]"
              } ${isExpanded ? "shadow-lg" : "shadow-sm hover:shadow-md"}`}
            >
              {/* Collapsed row — tap to expand */}
              <button
                onClick={() => handleExpand(msg)}
                className="w-full text-left px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4"
              >
                {/* Unread dot */}
                <span className={`mt-2 shrink-0 w-2 h-2 rounded-full ${msg.read ? "bg-transparent" : "bg-[#b3a384]"}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-sm font-bold text-stone-800 truncate ${!msg.read ? "font-black" : ""}`}>
                      {msg.name}
                    </span>
                    {!msg.read && (
                      <span className="text-[9px] uppercase tracking-[2px] font-black text-[#b3a384] bg-[#f5f0ea] px-2 py-0.5 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 truncate">{msg.message}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{dateStr}</p>
                  <p className="text-[9px] text-gray-300 whitespace-nowrap">{timeStr}</p>
                </div>

                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`shrink-0 mt-1 text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 space-y-4 border-t border-gray-100">
                  {/* Contact details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Email</p>
                      <a href={`mailto:${msg.email}`} className="text-sm text-stone-700 hover:text-[#b3a384] transition-colors break-all">
                        {msg.email}
                      </a>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-1">Phone</p>
                      {msg.phone ? (
                        <a href={`tel:${msg.phone}`} className="text-sm text-stone-700 hover:text-[#b3a384] transition-colors">
                          {msg.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-300">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="bg-[#faf9f7] border-l-4 border-[#b3a384] rounded-r-lg px-4 py-4">
                    <p className="text-[9px] uppercase tracking-[2px] font-black text-gray-400 mb-2">Message</p>
                    <p className="text-stone-700 leading-relaxed text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => onRegisterClient(msg)}
                      className="flex-1 sm:flex-none min-h-[44px] bg-black text-white px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black hover:bg-[#b3a384] transition-all text-center flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      Register as Client
                    </button>
                    {msg.phone && (
                      <a
                        href={`https://wa.me/${msg.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none min-h-[44px] bg-[#25D366] text-white px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black hover:bg-[#1ebe5d] transition-all text-center flex items-center justify-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => handleToggleRead(msg.id, !!msg.read)}
                      className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black border border-gray-200 hover:bg-gray-50 transition-all text-gray-500 flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {msg.read ? (
                          <><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></>
                        ) : (
                          <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                        )}
                      </svg>
                      {msg.read ? "Mark Unread" : "Mark Read"}
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      disabled={isDeleting}
                      className="min-h-[44px] px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-[2px] font-black border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                      {isDeleting ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Password Change Card ─────────────────
function PasswordChangeCard({ onLogout }: { onLogout: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setMsg("New passwords do not match"); setStatus("error"); return; }
    if (next.length < 4) { setMsg("Password must be at least 4 characters"); setStatus("error"); return; }
    setStatus("saving");
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Password updated — logging out now...");
      setStatus("ok");
      await fetch("/api/auth", { method: "DELETE" });
      setTimeout(() => onLogout(), 1500);
    } else {
      setStatus("error"); setMsg(data.error || "Failed to update password");
    }
  };

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-6 border-b pb-4">Admin Password</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-2xl">
        <div>
          <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Current Password</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} required className="admin-input" placeholder="Current password" />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">New Password</label>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} required className="admin-input" placeholder="New password" />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Confirm New Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="admin-input" placeholder="Repeat new password" />
        </div>
        <div className="lg:col-span-3 flex items-center gap-4">
          <button type="submit" disabled={status === "saving"} className="min-h-[44px] px-6 bg-black text-white text-[10px] uppercase tracking-[2px] font-black rounded hover:bg-[#b3a384] transition-all disabled:opacity-40">
            {status === "saving" ? "Saving..." : "Update Password"}
          </button>
          {msg && (
            <p className={`text-[11px] font-bold ${status === "ok" ? "text-green-600" : "text-red-500"}`}>{msg}</p>
          )}
        </div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const [isLocked, setIsLocked] = useState(true);
  const [lockPw, setLockPw] = useState("");
  const [lockErr, setLockErr] = useState("");
  const [lockLoading, setLockLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("site");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [registerFromMsg, setRegisterFromMsg] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const contentRef = useRef<SiteContent | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [c, imgs] = await Promise.all([
        fetch("/api/content").then((r) => r.json()),
        fetch("/api/images").then((r) => r.json()),
      ]);
      setContent(c);
      setAllImages(imgs.images ?? []);

      // Fetch messages
      fetch("/api/admin/messages")
        .then(r => r.json())
        .then(data => setMessages(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error fetching messages:", err));

      // Fetch clients
      fetch("/api/admin/clients")
        .then(r => r.json())
        .then(data => setClients(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error fetching clients:", err));

      // Populate server-signed thumbnail map
      if (imgs.thumbnails) {
        Object.entries(imgs.thumbnails).forEach(([url, thumb]) => thumbMap.set(url, thumb as string));
      }
      setLoading(false);
    } catch {
      setIsLocked(true);
    }
  }, []);

  const handleLockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLockLoading(true);
    setLockErr("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: lockPw }),
      });
      if (res.ok) {
        setIsLocked(false);
        setLockPw("");
        fetchData();
      } else {
        setLockErr("كلمة المرور غير صحيحة");
      }
    } catch {
      setLockErr("Connection error. Try again.");
    } finally {
      setLockLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth")
      .then(r => { if (r.ok) { setIsLocked(false); fetchData(); } })
      .catch(() => {});
  }, [fetchData]);

  const refreshClients = useCallback(async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
  }, []);

  const refreshImages = async () => {
    const res = await fetch("/api/images?nocache=1");
    const data = await res.json();
    setAllImages(data.images || []);
    if (data.thumbnails) {
      Object.entries(data.thumbnails).forEach(([url, thumb]) => thumbMap.set(url, thumb as string));
    }
  };

  const set = useCallback((path: string, value: unknown) => {
    setHasChanges(true);
    setContent((prev: SiteContent | null) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let curr = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = value;
      return clone;
    });
  }, []);

  // Keep a ref so the auto-save callback always reads the latest content without stale closure
  useEffect(() => { contentRef.current = content; }, [content]);

  const save = useCallback(async () => {
    if (!contentRef.current) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentRef.current),
      });
      if (res.ok) {
        setHasChanges(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else if (res.status === 401) {
        setSaveStatus("error");
        alert("SESSION EXPIRED — Please log in again.\n\nClick OK, then refresh the page and log in.");
        window.location.href = "/admin";
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, []);

  // Auto-save: reschedule 1.5s timer on every content change (debounce)
  useEffect(() => {
    if (!hasChanges || loading) return;
    setSaveStatus("pending");
    const id = setTimeout(() => save(), 1500);
    return () => clearTimeout(id);
  }, [content, hasChanges, loading, save]);

  if (isLocked) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 bg-[#0e0e0e] border border-white/10 p-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#b8965a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p className="text-center font-display text-2xl text-white tracking-widest mb-1">AHMED ELAKAD</p>
        <p className="text-center text-[10px] tracking-[4px] text-[#b8965a] uppercase mb-8">Admin Panel</p>
        <form onSubmit={handleLockSubmit} className="space-y-4">
          <input
            type="password"
            value={lockPw}
            onChange={e => setLockPw(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#b8965a] transition-colors placeholder-white/20"
            autoFocus
          />
          {lockErr && <p className="text-red-400 text-xs text-center">{lockErr}</p>}
          <button
            type="submit"
            disabled={lockLoading}
            className="w-full bg-[#b8965a] hover:bg-[#8a6e3e] text-white py-3 text-xs tracking-[3px] uppercase font-medium transition-colors disabled:opacity-50"
          >
            {lockLoading ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );

  if (!content) return (
    <div className="fixed inset-0 bg-[#0e0e0e] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#b8965a] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] tracking-[4px] text-[#b8965a] uppercase">Loading</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#fcfaf9] overflow-x-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50] md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Header Bar */}
      <div className="fixed top-0 inset-x-0 bg-white border-b h-16 flex items-center justify-between px-6 z-[45] md:hidden shadow-sm">
        <p className="font-display tracking-[2px] uppercase text-xs font-bold">
          Ahmed Elakad
        </p>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-black p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Open Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile auto-save status indicator — replaces the manual save button */}
      {(saveStatus === "saving" || saveStatus === "saved" || saveStatus === "error") && !sidebarOpen && (
        <div
          onClick={saveStatus === "error" ? save : undefined}
          className={`fixed bottom-6 right-6 z-[40] md:hidden px-5 py-3 rounded-full shadow-xl text-xs font-black tracking-[2px] uppercase flex items-center gap-2 border-2 transition-all ${
            saveStatus === "saving" ? "bg-[#b3a384] text-white border-white/20 animate-pulse" :
            saveStatus === "saved" ? "bg-green-600 text-white border-white/20" :
            "bg-red-600 text-white border-white/20 cursor-pointer"
          }`}
        >
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "⚠ Retry"}
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 md:w-64 lg:w-80 bg-white border-r px-5 py-8 flex flex-col fixed md:sticky top-0 h-screen overflow-y-auto shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-[55] transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-12 text-center">
          <div className="bg-black text-white inline-block px-5 py-2 mb-4">
            <p className="font-display tracking-[3px] uppercase text-sm">
              COUTURE CMS
            </p>
          </div>
          <p className="text-[10px] text-gray-300 uppercase tracking-[5px] font-bold">
            Ahmed Elakad
          </p>
        </div>

        <nav className="flex-1 flex flex-col justify-between py-8">
          <div className="space-y-2">
            <p className="text-[10px] tracking-[4px] uppercase text-[#b3a384] font-black mb-6 text-center">
              Core Pages
            </p>
            {(
              [
                "site",
                "home",
                "about",
                "bridal",
                "couture",
                "experience",
                "contact",
                "social",
                "media",
                "messages",
                "clients",
              ] as Section[]
            ).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setActiveSection(s);
                  setSidebarOpen(false);
                }}
                className={`w-full px-4 py-4 text-[10px] uppercase tracking-[2px] font-medium transition-all duration-300 rounded text-center cursor-pointer relative ${
                  activeSection === s
                    ? "bg-black text-white shadow-lg"
                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                }`}
              >
                {s === "about"
                  ? "ABOUT US"
                  : s === "experience"
                    ? "EXPERIENCE"
                    : s === "media"
                      ? "MEDIA LIBRARY"
                      : s === "site"
                        ? "GLOBAL SETTINGS"
                        : s === "social"
                          ? "SOCIAL SETTINGS"
                          : s === "messages"
                            ? "MESSAGES"
                            : s === "clients"
                              ? "CLIENTS"
                              : s.toUpperCase()}
                {s === "clients" && clients.length > 0 && activeSection !== "clients" && (
                  <span className="absolute top-3 right-3 bg-[#b3a384] text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                    {clients.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-12 border-t pt-8 space-y-3 px-2 pb-10">
          {/* Auto-save status — replaces the manual save button */}
          <div className={`w-full py-5 text-[11px] tracking-[4px] uppercase font-bold text-center transition-colors ${
            saveStatus === "saving" ? "text-gray-400 animate-pulse" :
            saveStatus === "saved" ? "text-green-600" :
            saveStatus === "error" ? "text-red-500" :
            hasChanges ? "text-[#b3a384] animate-pulse" :
            "text-gray-300"
          }`}>
            {saveStatus === "saving" ? "SAVING…" :
             saveStatus === "saved" ? "✓ ALL SAVED" :
             saveStatus === "error" ? "SAVE FAILED" :
             hasChanges ? "SAVING SOON…" :
             "AUTO-SAVE ON"}
          </div>
          {saveStatus === "error" && (
            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-[#1a1a1a] text-white py-4 text-[11px] tracking-[4px] uppercase font-bold hover:bg-red-600 cursor-pointer transition-all rounded-sm shadow-xl active:scale-95 disabled:opacity-50"
            >
              RETRY SAVE
            </button>
          )}
          <button
            onClick={() =>
              fetch("/api/auth", { method: "DELETE" }).then(() => {
                setContent(null);
                setIsLocked(true);
              })
            }
            className="w-full text-[9px] text-gray-300 uppercase tracking-[4px] text-center py-3 hover:text-red-400 cursor-pointer transition-colors font-bold"
          >
            TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-3 pt-20 sm:p-4 sm:pt-24 md:p-8 lg:p-12 overflow-x-hidden bg-[#fcfaf9]">
        <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
          <header className="mb-5 sm:mb-10 flex items-start sm:items-end justify-between gap-3 border-b pb-4 sm:pb-7 border-gray-100">
            <div>
              <p className="hidden sm:block text-[9px] tracking-[5px] uppercase text-[#b3a384] font-bold mb-2 opacity-80">
                Management Module
              </p>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display uppercase tracking-widest text-black">
                  {activeSection === "about"
                    ? "ABOUT US"
                    : activeSection === "site"
                      ? "GLOBAL SETTINGS"
                      : activeSection === "social"
                        ? "SOCIAL SETTINGS"
                        : activeSection === "media"
                          ? "MEDIA LIBRARY"
                          : activeSection === "clients"
                            ? "CLIENTS"
                            : activeSection.toUpperCase()}
                </h2>
                {activeSection === "clients" && clients.length > 0 && (
                  <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full">{clients.length}</span>
                )}
              </div>
            </div>
            <div className="hidden sm:block text-[9px] tracking-[3px] uppercase text-gray-400 font-bold whitespace-nowrap bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              System Status: <span className="text-green-600">Online</span>
            </div>
          </header>

          {/* SITE SETTINGS */}
          {activeSection === "site" && (
            <div className="space-y-6 lg:space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <SingleImageEditor
                  label="GLOBAL BRAND LOGO"
                  image={content.siteInfo?.logo ?? ""}
                  allImages={allImages}
                  onChange={(src) => set("siteInfo.logo", src)}
                />
              </div>

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      Global Brand Identity
                    </label>
                    <input
                      value={content.siteInfo?.brandName ?? ""}
                      onChange={(e) =>
                        set("siteInfo.brandName", e.target.value)
                      }
                      className="admin-input py-4 text-lg font-display cursor-text"
                      placeholder="e.g. AHMED ELAKAD"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      Sub-Label Title
                    </label>
                    <input
                      value={content.siteInfo?.labelName ?? ""}
                      onChange={(e) =>
                        set("siteInfo.labelName", e.target.value)
                      }
                      className="admin-input py-4 text-lg font-display cursor-text"
                      placeholder="e.g. AHMED THE LABEL"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      Global SEO Meta Description
                    </label>
                    <textarea
                      value={content.siteInfo?.description ?? ""}
                      onChange={(e) =>
                        set("siteInfo.description", e.target.value)
                      }
                      className="admin-input min-h-[100px] py-4 text-base cursor-text"
                      placeholder="Describe your brand for search engines..."
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <h3 className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 border-b pb-4">
                  Footer & Credits
                </h3>
                <div>
                  <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                    Copyright Text
                  </label>
                  <input
                    value={content.footer?.copyright ?? ""}
                    onChange={(e) => set("footer.copyright", e.target.value)}
                    className="admin-input py-3 cursor-text"
                  />
                </div>
              </div>

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <PasswordChangeCard onLogout={() => { setContent(null); setIsLocked(true); }} />
              </div>
            </div>
          )}

          {/* HOME SETTINGS */}
          {activeSection === "home" && (
            <div className="space-y-6 lg:space-y-12">
              {/* The House of Ahmed Elakad */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  THE HOUSE OF AHMED ELAKAD
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-start">
                  <div>
                    <p className="text-xs uppercase tracking-[2px] text-gray-400 mb-4">Text Paragraphs</p>
                    <BioParagraphEditor
                      bio={content.homepage?.houseBio ?? []}
                      onChange={(b) => set("homepage.houseBio", b)}
                    />
                  </div>
                  <SingleImageEditor
                    label="SECTION IMAGE"
                    image={content.homepage?.houseImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(img) => set("homepage.houseImage", img)}
                  />
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  SEO
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input
                    value={content.homepage?.metaTitle ?? ""}
                    onChange={(e) => set("homepage.metaTitle", e.target.value)}
                    className="admin-input cursor-text"
                    placeholder="Page Title (Browser Tab)"
                  />
                  <input
                    value={content.homepage?.metaDescription ?? ""}
                    onChange={(e) =>
                      set("homepage.metaDescription", e.target.value)
                    }
                    className="admin-input cursor-text"
                    placeholder="Meta Description"
                  />
                </div>
              </div>
              {/* Hero Image */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <SingleImageEditor
                  label="HERO BACKGROUND IMAGE"
                  image={content.homepage?.heroImage ?? ""}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(src) => set("homepage.heroImage", src)}
                />
              </div>

              {/* HERO */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  HERO
                </label>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Label (small text above heading)</p>
                    <input
                      value={content.homepage?.heroLabel ?? ""}
                      onChange={(e) => set("homepage.heroLabel", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="Bespoke Bridal Couture"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Main Heading</p>
                    <input
                      value={content.homepage?.heroHeading ?? ""}
                      onChange={(e) => set("homepage.heroHeading", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="Crafting Bridal Dreams"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Subtitle (italic)</p>
                    <input
                      value={content.homepage?.heroSubtitle ?? ""}
                      onChange={(e) => set("homepage.heroSubtitle", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="One Couture Creation at a Time"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Description</p>
                    <textarea
                      value={content.homepage?.heroDescription ?? ""}
                      onChange={(e) => set("homepage.heroDescription", e.target.value)}
                      className="admin-input cursor-text resize-none"
                      rows={3}
                      placeholder="Bespoke bridal couture designed and handcrafted in Cairo..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Button Text</p>
                      <input
                        value={content.homepage?.heroCTAText ?? ""}
                        onChange={(e) => set("homepage.heroCTAText", e.target.value)}
                        className="admin-input cursor-text"
                        placeholder="Book a Private Appointment"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Button Link</p>
                      <input
                        value={content.homepage?.heroCTAHref ?? ""}
                        onChange={(e) => set("homepage.heroCTAHref", e.target.value)}
                        className="admin-input cursor-text"
                        placeholder="/contact"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Collections Section */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  COLLECTIONS
                </label>
                <div className="space-y-10">
                  {([
                    { n: "1", imgKey: "collection1Image", labelKey: "collection1Label", hrefKey: "collection1Href", defaultLabel: "Bridal Collection", defaultHref: "/bridal" },
                    { n: "2", imgKey: "collection2Image", labelKey: "collection2Label", hrefKey: "collection2Href", defaultLabel: "Evening Couture", defaultHref: "/couture" },
                    { n: "3", imgKey: "collection3Image", labelKey: "collection3Label", hrefKey: "collection3Href", defaultLabel: "Modest Bridal", defaultHref: "/bridal" },
                  ] as const).map((col) => (
                    <div key={col.n} className="border-t border-gray-100 pt-8 first:border-none first:pt-0">
                      <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-4">Card {col.n}</p>
                      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
                        <SingleImageEditor
                          label={`CARD ${col.n} IMAGE`}
                          image={(content.homepage as Record<string, string>)?.[col.imgKey] ?? ""}
                          allImages={allImages}
                          onUploadComplete={refreshImages}
                          onChange={(src) => set(`homepage.${col.imgKey}`, src)}
                        />
                        <div className="space-y-3">
                          <input
                            value={(content.homepage as Record<string, string>)?.[col.labelKey] ?? ""}
                            onChange={(e) => set(`homepage.${col.labelKey}`, e.target.value)}
                            className="admin-input cursor-text"
                            placeholder={col.defaultLabel}
                          />
                          <input
                            value={(content.homepage as Record<string, string>)?.[col.hrefKey] ?? ""}
                            onChange={(e) => set(`homepage.${col.hrefKey}`, e.target.value)}
                            className="admin-input cursor-text"
                            placeholder={col.defaultHref}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real Brides Gallery */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <GalleryEditor
                  label="REAL BRIDES"
                  images={content.homepage?.featuredImages ?? []}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(imgs) => set("homepage.featuredImages", imgs)}
                />
              </div>

              {/* Bridal Journey CTA */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  BRIDAL JOURNEY
                </label>
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
                  <SingleImageEditor
                    label="DECORATIVE SIDE IMAGE"
                    image={content.homepage?.ctaImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("homepage.ctaImage", src)}
                  />
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Heading</p>
                      <input
                        value={content.homepage?.ctaHeading ?? ""}
                        onChange={(e) => set("homepage.ctaHeading", e.target.value)}
                        className="admin-input cursor-text"
                        placeholder="Bridal Journey"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Description</p>
                      <textarea
                        value={content.homepage?.ctaDescription ?? ""}
                        onChange={(e) => set("homepage.ctaDescription", e.target.value)}
                        className="admin-input cursor-text resize-none"
                        rows={3}
                        placeholder="Private consultations are available by appointment only at our Cairo atelier."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Button Text</p>
                        <input
                          value={content.homepage?.ctaButtonText ?? ""}
                          onChange={(e) => set("homepage.ctaButtonText", e.target.value)}
                          className="admin-input cursor-text"
                          placeholder="Reserve Your Consultation"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-1">Button Link</p>
                        <input
                          value={content.homepage?.ctaButtonHref ?? ""}
                          onChange={(e) => set("homepage.ctaButtonHref", e.target.value)}
                          className="admin-input cursor-text"
                          placeholder="/contact"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT SETTINGS */}
          {activeSection === "about" && (
            <div className="space-y-6 lg:space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  About Page SEO
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input
                    value={content.about?.metaTitle ?? ""}
                    onChange={(e) => set("about.metaTitle", e.target.value)}
                    className="admin-input cursor-text"
                    placeholder="Page Title (Browser Tab)"
                  />
                  <input
                    value={content.about?.metaDescription ?? ""}
                    onChange={(e) =>
                      set("about.metaDescription", e.target.value)
                    }
                    className="admin-input cursor-text"
                    placeholder="Meta Description"
                  />
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      PAGE HEADER
                    </label>
                    <input
                      value={content.about?.title ?? ""}
                      onChange={(e) => set("about.title", e.target.value)}
                      className="admin-input font-display text-xl cursor-text"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      DESIGNER NAME
                    </label>
                    <input
                      value={content.about?.subtitle ?? ""}
                      onChange={(e) => set("about.subtitle", e.target.value)}
                      className="admin-input font-display text-xl cursor-text"
                    />
                  </div>
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                  <SingleImageEditor
                    label="HERO BACKGROUND IMAGE (Right Panel)"
                    image={content.about?.portraitImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("about.portraitImage", src)}
                  />
              </div>

              {/* Tagline */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                  ITALIC TAGLINE (shown in gold under the heading)
                </label>
                <input
                  value={(content.about as any)?.tagline ?? ""}
                  onChange={(e) => set("about.tagline", e.target.value)}
                  className="admin-input font-serif italic"
                  placeholder="Crafted for the woman who seeks the exceptional."
                />
              </div>

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <BioParagraphEditor
                  bio={content.about?.bio ?? []}
                  onChange={(b) => set("about.bio", b)}
                />
              </div>

              {/* Gallery images */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <div className="flex items-center justify-between border-b pb-3 mb-8">
                  <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">
                    GALLERY IMAGES (bottom 4-image grid)
                  </label>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">4 slots</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
                  {[
                    { key: 0, label: "LEFT PANEL — Large tall image" },
                    { key: 1, label: "CENTER TOP — Detail / close-up" },
                    { key: 2, label: "CENTER BOTTOM — Atelier sign / detail" },
                    { key: 3, label: "RIGHT PANEL — Large tall image" },
                  ].map(({ key, label }) => (
                    <SingleImageEditor
                      key={key}
                      label={label}
                      image={(content.about?.gallery ?? [])[key] ?? ""}
                      allImages={allImages}
                      onUploadComplete={refreshImages}
                      onChange={(src) => {
                        const g = [...(content.about?.gallery ?? ["", "", "", ""])];
                        while (g.length < 4) g.push("");
                        g[key] = src;
                        set("about.gallery", g);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* BRIDAL SETTINGS */}
          {activeSection === "bridal" && (
            <div className="space-y-6 lg:space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <SingleImageEditor
                  label="BRIDAL PAGE BANNER IMAGE"
                  image={content.bridal?.bannerImage ?? ""}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(src) => set("bridal.bannerImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <YearCollectionEditor
                  sectionKey="bridal"
                  years={content.bridal?.years ?? {}}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(years) => set("bridal.years", years)}
                />
              </div>
            </div>
          )}

          {/* COUTURE SETTINGS */}
          {activeSection === "couture" && (
            <div className="space-y-6 lg:space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <SingleImageEditor
                  label="COUTURE PAGE BANNER IMAGE"
                  image={content.couture?.bannerImage ?? ""}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(src) => set("couture.bannerImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <YearCollectionEditor
                  sectionKey="couture"
                  years={content.couture?.years ?? {}}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(years) => set("couture.years", years)}
                />
              </div>
            </div>
          )}

          {/* EXPERIENCE SETTINGS */}
          {activeSection === "experience" && (
            <div className="space-y-6 lg:space-y-12">

              {/* SEO */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">Experience Page SEO</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input value={(content.experience as any)?.metaTitle ?? ""} onChange={(e) => set("experience.metaTitle", e.target.value)} className="admin-input" placeholder="Page Title (Browser Tab)" />
                  <input value={(content.experience as any)?.metaDescription ?? ""} onChange={(e) => set("experience.metaDescription", e.target.value)} className="admin-input" placeholder="Meta Description" />
                </div>
              </div>

              {/* Client Videos Section */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">CLIENT VIDEOS SECTION</label>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">SECTION TITLE</label>
                      <input value={(content.experience as any)?.videoSectionTitle ?? ""} onChange={(e) => set("experience.videoSectionTitle", e.target.value)} className="admin-input font-display text-xl" placeholder="CLIENT STORIES" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">SECTION SUBTITLE (optional)</label>
                      <input value={(content.experience as any)?.videoSectionSubtitle ?? ""} onChange={(e) => set("experience.videoSectionSubtitle", e.target.value)} className="admin-input" placeholder="A few words from our brides..." />
                    </div>
                  </div>
                  <VideoListEditor
                    videos={(content.experience as any)?.videos ?? []}
                    onChange={(v) => set("experience.videos", v)}
                  />
                </div>
              </div>

              {/* Hero Section */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">HERO SECTION</label>
                <div className="space-y-6">
                  <SingleImageEditor
                    label="HERO BACKGROUND IMAGE"
                    image={(content.experience as any)?.heroImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("experience.heroImage", src)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">EYEBROW TEXT (small, above heading)</label>
                      <input value={(content.experience as any)?.heroSubheading ?? ""} onChange={(e) => set("experience.heroSubheading", e.target.value)} className="admin-input" placeholder="THE ELAKAD" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">MAIN HEADING</label>
                      <input value={(content.experience as any)?.heroHeading ?? ""} onChange={(e) => set("experience.heroHeading", e.target.value)} className="admin-input font-display text-xl" placeholder="EXPERIENCE" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">HERO DESCRIPTION PARAGRAPHS</label>
                    <BioParagraphEditor
                      bio={(content.experience as any)?.heroDescriptions ?? []}
                      onChange={(b) => set("experience.heroDescriptions", b)}
                    />
                  </div>
                </div>
              </div>

              {/* Kind Words Section */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">KIND WORDS — TESTIMONIALS SECTION</label>
                <div className="space-y-6">
                  <SingleImageEditor
                    label="SECTION BACKGROUND IMAGE (optional)"
                    image={(content.experience as any)?.kindWordsBgImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("experience.kindWordsBgImage", src)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">SECTION TITLE</label>
                      <input value={(content.experience as any)?.kindWordsTitle ?? ""} onChange={(e) => set("experience.kindWordsTitle", e.target.value)} className="admin-input font-display text-xl" placeholder="KIND WORDS" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">INTRO TEXT</label>
                      <textarea value={(content.experience as any)?.kindWordsIntro ?? ""} onChange={(e) => set("experience.kindWordsIntro", e.target.value)} className="admin-input min-h-[80px] font-light p-4" placeholder="We are honored to be a part of our clients' most special moments..." />
                    </div>
                  </div>
                  <TestimonialsEditor
                    testimonials={(content.experience as any)?.testimonials ?? []}
                    onChange={(t) => set("experience.testimonials", t)}
                  />
                </div>
              </div>

              {/* CTA Section */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">YOUR STORY — BOTTOM CTA SECTION</label>
                <div className="space-y-6">
                  <SingleImageEditor
                    label="CTA BACKGROUND IMAGE (leave blank to reuse hero image)"
                    image={(content.experience as any)?.ctaImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("experience.ctaImage", src)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">CTA HEADING</label>
                      <input value={(content.experience as any)?.ctaHeading ?? ""} onChange={(e) => set("experience.ctaHeading", e.target.value)} className="admin-input font-display text-xl" placeholder="YOUR STORY" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">CTA ITALIC SUBTITLE</label>
                      <input value={(content.experience as any)?.ctaSubtitle ?? ""} onChange={(e) => set("experience.ctaSubtitle", e.target.value)} className="admin-input font-serif italic" placeholder="deserves to be extraordinary" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">CTA BODY TEXT</label>
                    <textarea value={(content.experience as any)?.ctaText ?? ""} onChange={(e) => set("experience.ctaText", e.target.value)} className="admin-input min-h-[80px] font-light p-4" placeholder="We would be honored to create something uniquely yours." />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* CONTACT SETTINGS */}
          {activeSection === "contact" && (
            <div className="space-y-6 lg:space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  Contact Page SEO
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input
                    value={content.contact?.metaTitle ?? ""}
                    onChange={(e) => set("contact.metaTitle", e.target.value)}
                    className="admin-input"
                    placeholder="Page Title (Browser Tab)"
                  />
                  <input
                    value={content.contact?.metaDescription ?? ""}
                    onChange={(e) =>
                      set("contact.metaDescription", e.target.value)
                    }
                    className="admin-input"
                    placeholder="Meta Description"
                  />
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      PAGE TITLE
                    </label>
                    <input
                      value={content.contact?.pageTitle ?? ""}
                      onChange={(e) => set("contact.pageTitle", e.target.value)}
                      className="admin-input font-display text-xl md:text-2xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      HERO CAPTION
                    </label>
                    <input
                      value={content.contact?.pageSubtitle ?? ""}
                      onChange={(e) =>
                        set("contact.pageSubtitle", e.target.value)
                      }
                      className="admin-input font-display text-xl md:text-2xl"
                    />
                  </div>
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <SingleImageEditor
                  label="CONTACT HERO BACKGROUND"
                  image={content.contact?.heroImage ?? ""}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(src) => set("contact.heroImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 mb-12">
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold block mb-3">
                      PUBLIC EMAIL
                    </label>
                    <input
                      value={content.contact?.email ?? ""}
                      onChange={(e) => set("contact.email", e.target.value)}
                      className="admin-input py-3"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold block mb-3">
                      STUDIO LOCATION
                    </label>
                    <input
                      value={content.contact?.location ?? ""}
                      onChange={(e) => set("contact.location", e.target.value)}
                      className="admin-input py-3"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-3">
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold">
                      CONTACT LINES (PHONE)
                    </label>
                    <button
                      onClick={() => {
                        const ph = [...(content.contact?.phones ?? []), ""];
                        set("contact.phones", ph);
                      }}
                      className="text-[10px] font-bold text-[#b3a384] uppercase tracking-widest"
                    >
                      + ADD PHONE
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(content.contact?.phones ?? []).map(
                      (p: string, i: number) => (
                        <div key={i} className="relative group">
                          <input
                            value={p}
                            onChange={(e) => {
                              const ph = [...(content.contact?.phones ?? [])];
                              ph[i] = e.target.value;
                              set("contact.phones", ph);
                            }}
                            className="admin-input text-lg font-light tracking-widest"
                          />
                          <button
                            onClick={() => {
                              const ph = (content.contact?.phones ?? []).filter(
                                (_: any, idx: number) => idx !== i,
                              );
                              set("contact.phones", ph);
                            }}
                            className="absolute top-1/2 -translate-y-1/2 right-4 bg-red-500 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* International Brides Section */}
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <div className="flex items-center gap-3 border-b pb-4 mb-8">
                  <span className="text-[10px] text-[#b3a384] font-black uppercase tracking-widest">🌍</span>
                  <label className="text-xs tracking-[3px] uppercase text-gray-500 font-bold">
                    INTERNATIONAL BRIDES SECTION
                  </label>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">
                      SECTION HEADING
                    </label>
                    <input
                      value={(content.contact as any)?.internationalTitle ?? ""}
                      onChange={(e) => set("contact.internationalTitle", e.target.value)}
                      className="admin-input font-display text-xl"
                      placeholder="Worldwide Shipping Available"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[3px] text-gray-400 font-bold mb-2 block">
                      SECTION TEXT
                    </label>
                    <textarea
                      value={(content.contact as any)?.internationalText ?? ""}
                      onChange={(e) => set("contact.internationalText", e.target.value)}
                      className="admin-input min-h-[130px] font-light leading-relaxed p-4"
                      placeholder="Dreaming of an Ahmed Elakad gown from outside Egypt? We ship our bespoke creations to brides around the world..."
                    />
                  </div>
                  <SingleImageEditor
                    label="SIDE IMAGE (optional — leave blank for full-width text layout)"
                    image={(content.contact as any)?.internationalImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("contact.internationalImage", src)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SOCIAL SETTINGS */}
          {activeSection === "social" && (
            <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
              <div className="space-y-6 lg:space-y-12">
                {["facebook", "instagram", "whatsapp", "threads", "tiktok"].map((s) => (
                  <div key={s} className="relative">
                    <label className="text-[10px] uppercase tracking-[5px] text-gray-400 font-bold mb-4 block">
                      {s}
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full font-bold text-xs uppercase">
                        {s[0]}
                      </div>
                      <input
                        value={(content.social && (content.social as any)[s]) ?? ""}
                        onChange={(e) => set(`social.${s}`, e.target.value)}
                        className="admin-input flex-1 py-4 text-base italic text-gray-600"
                        placeholder={`Enter ${s} profile link...`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEDIA LIBRARY */}
          {activeSection === "media" && (
            <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-0 min-h-[600px]">
              <ImagePicker
                allImages={allImages}
                onUploadComplete={refreshImages}
                onSelect={(urls) => {
                  navigator.clipboard.writeText(urls.join("\n"));
                  alert(`${urls.length} Image URL(s) copied to clipboard!`);
                }}
                inline={true}
              />
            </div>
          )}

          {/* MESSAGES SECTION */}
          {activeSection === "messages" && (
            <>
              <MessagesPanel
                messages={messages}
                onRefresh={() =>
                  fetch("/api/admin/messages")
                    .then((r) => r.json())
                    .then((d) => setMessages(Array.isArray(d) ? d : []))
                }
                onDelete={async (id) => {
                  await fetch("/api/admin/messages", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
                  setMessages((prev: any[]) => prev.filter((m) => m.id !== id));
                }}
                onMarkRead={async (id, read) => {
                  await fetch("/api/admin/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, read }) });
                  setMessages((prev: any[]) => prev.map((m) => m.id === id ? { ...m, read } : m));
                }}
                onRegisterClient={(msg) => setRegisterFromMsg(msg)}
              />
              {registerFromMsg && (
                <ClientForm
                  existingClients={clients}
                  initial={{ name: registerFromMsg.name, email: registerFromMsg.email, phone: registerFromMsg.phone, sourceMessageId: registerFromMsg.id }}
                  onSave={async (data) => {
                    const res = await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, sourceMessageId: registerFromMsg.id }) });
                    if (!res.ok) {
                      const err = await res.json();
                      alert(err.error || "Failed to register client");
                      return;
                    }
                    await refreshClients();
                    setRegisterFromMsg(null);
                    setActiveSection("clients");
                  }}
                  onClose={() => setRegisterFromMsg(null)}
                />
              )}
            </>
          )}

          {/* CLIENTS SECTION */}
          {activeSection === "clients" && (
            <ClientsPanel
              clients={clients}
              allImages={allImages}
              onRefresh={refreshClients}
              onUploadComplete={refreshImages}
            />
          )}
        </div>
      </main>
    </div>
  );
}
