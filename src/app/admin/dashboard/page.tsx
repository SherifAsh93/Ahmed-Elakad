"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  totalPrice: number;
  payments: Payment[];
  dresses: Dress[];
  appointmentDate: string;
  nextAppointmentDate: string;
  fittingDate: string;
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
          : "fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 md:p-4"
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
            {/* Close Button with more margin */}
            {!inline && onClose && (
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-black transition-colors font-bold p-3 text-2xl ml-6 absolute -top-2 -right-4 md:static"
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
      [activeYear]: { collections: [...existing, { id: newId, name: "", images: [] }] },
    };
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
                <p className="text-[11px] uppercase tracking-[3px] font-black text-gray-500">
                  Design {collIdx + 1}
                </p>
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
      await onSave({ name, email, phone, notes, totalPrice: Number(totalPrice) || 0, appointmentDate, nextAppointmentDate, eventDate, dressType, branch, clientImages, status });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-y-auto max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="font-display text-base uppercase tracking-[4px]">
            {initial?.id ? "Edit Client" : "New Client"}
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-black text-2xl font-bold transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone first — it's the primary reference */}
            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">
                Mobile Number <span className="text-[#b3a384]">— main reference *</span>
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
                    This number is already registered under <span className="underline">{dupClient.name || dupClient.id}</span>. Each mobile number can only have one client profile.
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">
                Client Name * <span className="text-[#b3a384] normal-case tracking-normal">— بالعربي</span>
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
                <p className="mt-1.5 text-[10px] text-red-500 font-bold flex items-center gap-1">
                  ⚠️ الاسم يجب أن يكون بالعربي — يبدو أنك كتبت بالإنجليزي
                </p>
              )}
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Total Price (EGP)</label>
              <input type="number" min="0" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} className="admin-input" placeholder="0" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Client["status"])} className="admin-input">
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Appointment Date</label>
              <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="admin-input" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Next Appointment</label>
              <input type="date" value={nextAppointmentDate} onChange={e => setNextAppointmentDate(e.target.value)} className="admin-input" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Event Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="admin-input" />
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
            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Upload Images <span className="text-gray-300 normal-case tracking-normal">(optional)</span></label>
              <label className="flex items-center justify-center gap-2 w-full min-h-[48px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#b3a384] transition-colors text-[10px] uppercase tracking-[2px] font-bold text-gray-400 hover:text-[#b3a384]">
                <span>📷</span>
                <span>{imageUploadStatus ?? "Tap to upload photos"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={!!imageUploadStatus}
                />
              </label>
              {clientImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {clientImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                      <button
                        type="button"
                        onClick={() => setClientImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Email <span className="text-gray-300 normal-case tracking-normal">(optional)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="admin-input" placeholder="client@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[9px] uppercase tracking-[3px] text-gray-400 font-bold block mb-1.5">Notes <span className="text-gray-300 normal-case tracking-normal">— ملاحظات (اختياري)</span></label>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
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

// ── Clients Panel ────────────────────────
// ── Fitting Appointment Modal ────────────
function FittingModal({
  current,
  onSave,
  onClose,
}: {
  current: string;
  onSave: (date: string) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(current || new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    await onSave(date);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-3">
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [paymentClientId, setPaymentClientId] = useState<string | null>(null);
  const [fittingClientId, setFittingClientId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dressPickerInfo, setDressPickerInfo] = useState<{ clientId: string; dressId: string } | null>(null);

  const totalCollected = clients.reduce((s, c) => s + clientPaid(c), 0);
  const totalRemaining = clients.reduce((s, c) => s + clientRemaining(c), 0);

  const statusCounts = {
    active: clients.filter(c => c.status === "active").length,
    pending: clients.filter(c => c.status === "pending").length,
    completed: clients.filter(c => c.status === "completed").length,
  };

  const statusColor = (s: Client["status"]) =>
    s === "active" ? "bg-green-100 text-green-700" :
    s === "completed" ? "bg-blue-100 text-blue-700" :
    "bg-amber-100 text-amber-700";

  const filtered = clients.filter(c => {
    const matchesStatus = filter === "all" || c.status === filter;
    const q = search.replace(/\D/g, "");
    const matchesSearch = !q || (c.phone ?? "").replace(/\D/g, "").includes(q);
    return matchesStatus && matchesSearch;
  });

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

  const handleDateChange = async (clientId: string, field: "appointmentDate" | "nextAppointmentDate" | "fittingDate", value: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, [field]: value }) });
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

  const handleRemoveDressImage = async (clientId: string, dressId: string, imageUrl: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "removeDressImage", dressId, imageUrl }) });
    fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: imageUrl }) }).catch(() => {});
    onRefresh();
  };

  const handleUpdateDressLabel = async (clientId: string, dressId: string, label: string) => {
    await fetch("/api/admin/clients", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, action: "updateDressLabel", dressId, label }) });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display uppercase tracking-widest text-black">Clients</h3>
            <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-full">{clients.length}</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[2px] mt-1 font-bold">
            EGP {totalCollected.toLocaleString()} collected · EGP {totalRemaining.toLocaleString()} remaining
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="text-[10px] font-black uppercase tracking-[2px] px-4 py-2.5 min-h-[44px] border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-all rounded flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            Refresh
          </button>
          <button onClick={() => setFormOpen(true)} className="text-[10px] font-black uppercase tracking-[2px] px-5 py-2.5 min-h-[44px] bg-black text-white hover:bg-[#b3a384] transition-all rounded flex items-center gap-2">
            + New Client
          </button>
        </div>
      </div>

      {/* Search by mobile */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          type="tel"
          inputMode="numeric"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by mobile number..."
          className="admin-input pl-11 text-base"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black text-lg font-bold transition-colors">✕</button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {([["active", "Active"], ["pending", "Pending"], ["completed", "Completed"]] as const).map(([s, label]) => (
          <div key={s} className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 text-center shadow-sm">
            <p className="text-lg sm:text-2xl font-black text-black">{statusCounts[s]}</p>
            <p className="text-[9px] uppercase tracking-[2px] font-bold text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-4">
        {(["all", "active", "pending", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`min-h-[40px] px-4 py-2 text-[10px] tracking-[2px] uppercase font-black rounded-full transition-all ${filter === f ? "bg-black text-white" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black"}`}>
            {f === "all" ? `All (${clients.length})` : `${f} (${statusCounts[f]})`}
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
              <button onClick={() => setExpandedId(isExpanded ? null : client.id)} className="w-full text-left px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4">
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
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                            <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-100 hover:opacity-80 transition-opacity" />
                          </a>
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
                            <button onClick={() => handleDeletePayment(client.id, p.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-black ml-1 shrink-0">✕</button>
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
                              <input
                                type="text"
                                value={dress.label}
                                onChange={e => handleUpdateDressLabel(client.id, dress.id, e.target.value)}
                                placeholder="Add a label (e.g. Wedding Dress)"
                                className="flex-1 text-xs border-0 border-b border-gray-100 focus:border-[#b3a384] focus:outline-none bg-transparent py-1 text-stone-600 placeholder:text-gray-300 transition-colors"
                              />
                              <button onClick={() => handleDeleteDress(client.id, dress.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-black shrink-0">✕</button>
                            </div>
                            {/* Dress images grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                              {dress.images.map((src) => (
                                <div key={src} className="relative group aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
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
                          <p className="text-sm font-bold text-rose-700">{new Date(client.fittingDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <button onClick={() => handleDateChange(client.id, "fittingDate", "")} className="text-rose-300 hover:text-rose-600 text-lg font-bold transition-colors">✕</button>
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
      {fittingClientId && (
        <FittingModal
          current={clients.find(c => c.id === fittingClientId)?.fittingDate ?? ""}
          onSave={async (date) => { await handleDateChange(fittingClientId, "fittingDate", date); setFittingClientId(null); }}
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
function PasswordChangeCard() {
  const router = useRouter();
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
      // Clear session so admin must re-login with new password
      await fetch("/api/auth", { method: "DELETE" });
      setTimeout(() => router.push("/admin"), 1500);
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
  const router = useRouter();
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
    } catch (e) {
      router.push("/admin");
    }
  }, [router]);

  useEffect(() => {
    fetchData();
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

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        setHasChanges(false);
        alert("CHANGES SAVED SUCCESSFULLY!");
      } else if (res.status === 401) {
        alert("SESSION EXPIRED — Please log in again.\n\nClick OK, then refresh the page and log in.");
        window.location.href = "/admin";
      } else {
        const data = await res.json().catch(() => ({}));
        alert("FAILED TO SAVE CHANGES.\n" + (data.error || "Please try again."));
      }
    } catch {
      alert("ERROR SAVING CHANGES — Check your internet connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!content) return null;

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

      {/* Mobile Floating Save Button — only visible when there are unsaved changes */}
      {hasChanges && !sidebarOpen && (
        <button
          onClick={save}
          disabled={saving}
          className="fixed bottom-6 right-6 z-[40] md:hidden bg-[#b3a384] text-white px-8 py-4 rounded-full shadow-2xl active:scale-95 transition-all font-bold text-xs tracking-[3px] uppercase flex items-center gap-3 border-2 border-white/20"
        >
          {saving ? "..." : "✓ SAVE"}
        </button>
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
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[#1a1a1a] text-white py-6 text-[11px] tracking-[4px] uppercase font-bold hover:bg-[#b3a384] cursor-pointer transition-all duration-500 disabled:opacity-50 rounded-sm shadow-xl active:scale-95"
          >
            {saving ? "COMMITTING..." : "SAVE ALL CHANGES"}
          </button>
          <button
            onClick={() =>
              fetch("/api/auth", { method: "DELETE" }).then(() =>
                router.push("/admin"),
              )
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
          <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-8 border-gray-100">
            <div>
              <p className="text-[9px] tracking-[5px] uppercase text-[#b3a384] font-bold mb-2 opacity-80">
                Management Module
              </p>
              <h2 className="text-2xl md:text-3xl font-display uppercase tracking-widest text-black">
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
            </div>
            <div className="text-[9px] tracking-[3px] uppercase text-gray-400 font-bold mb-1 whitespace-nowrap bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
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
                  <div>
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      Developer Credit Text
                    </label>
                    <input
                      value={content.footer?.creditText ?? ""}
                      onChange={(e) => set("footer.creditText", e.target.value)}
                      className="admin-input py-3 cursor-text"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <PasswordChangeCard />
              </div>
            </div>
          )}

          {/* HOME SETTINGS */}
          {activeSection === "home" && (
            <div className="space-y-6 lg:space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  Home Page SEO
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
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <SingleImageEditor
                  label="MAIN HERO BACKGROUND"
                  image={content.homepage?.heroImage ?? ""}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(src) => set("homepage.heroImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  Hero Buttons (Call to Action)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold">Button 1 (Beige)</p>
                    <input
                      value={content.homepage?.cta1Text ?? ""}
                      onChange={(e) => set("homepage.cta1Text", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="Find Your Dress"
                    />
                    <input
                      value={content.homepage?.cta1Href ?? ""}
                      onChange={(e) => set("homepage.cta1Href", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="/bridal"
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold">Button 2 (White)</p>
                    <input
                      value={content.homepage?.cta2Text ?? ""}
                      onChange={(e) => set("homepage.cta2Text", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="Book an Appointment"
                    />
                    <input
                      value={content.homepage?.cta2Href ?? ""}
                      onChange={(e) => set("homepage.cta2Href", e.target.value)}
                      className="admin-input cursor-text"
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <GalleryEditor
                  label="FEATURED COLLECTION PREVIEW"
                  images={content.homepage?.featuredImages ?? []}
                  allImages={allImages}
                  onUploadComplete={refreshImages}
                  onChange={(imgs) => set("homepage.featuredImages", imgs)}
                />
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
                    label="HERO BACKGROUND IMAGE"
                    image={content.about?.portraitImage ?? ""}
                    allImages={allImages}
                    onUploadComplete={refreshImages}
                    onChange={(src) => set("about.portraitImage", src)}
                  />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
                <BioParagraphEditor
                  bio={content.about?.bio ?? []}
                  onChange={(b) => set("about.bio", b)}
                />
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
            </div>
          )}

          {/* SOCIAL SETTINGS */}
          {activeSection === "social" && (
            <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-5 md:p-8 lg:p-12">
              <div className="space-y-6 lg:space-y-12">
                {["facebook", "instagram", "whatsapp"].map((s) => (
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
