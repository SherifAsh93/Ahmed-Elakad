"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import imageCompression from "browser-image-compression";

type Section =
  | "site"
  | "home"
  | "about"
  | "label"
  | "collections"
  | "contact"
  | "social"
  | "media";

// ── Image Picker Modal ───────────────────
function ImagePicker({
  allImages,
  onSelect,
  onClose,
  inline = false,
}: {
  allImages: string[];
  onSelect: (src: string) => void;
  onClose?: () => void;
  inline?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [urlPreviewOk, setUrlPreviewOk] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "url">("browse");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const perPage = 12; // Reduced for faster loading
  const filtered = allImages.filter((img) =>
    search ? img.toLowerCase().includes(search.toLowerCase()) : true,
  );
  const total = Math.ceil(filtered.length / perPage);
  const displayed = filtered.slice(page * perPage, (page + 1) * perPage);

  const handleImageLoad = (src: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(src);
      return next;
    });
  };

  const handleImageLoadStart = (src: string) => {
    setLoadingImages((prev) => new Set(prev).add(src));
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
        let fileToUpload: File | Blob = originalFile;
        if (originalFile.type.startsWith("image/")) {
          try {
            fileToUpload = await imageCompression(
              originalFile,
              compressionOptions,
            );
          } catch (e) {
            console.warn("Compression failed:", e);
          }
        }

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

      setUploadStatus("All Uploaded!");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed.");
      setUploadStatus(null);
    }
  };

  const handlePasteUrl = () => {
    const url = pasteUrl.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      // Warn about collection/console links that aren't direct images
      if (
        parsed.hostname === "console.cloudinary.com" ||
        parsed.hostname === "collection.cloudinary.com"
      ) {
        setUrlError(
          "This is a Cloudinary console/collection link, not a direct image URL. Copy the image URL instead (right-click image → Copy image address).",
        );
        return;
      }
      if (
        !/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(url) &&
        !url.includes("res.cloudinary.com")
      ) {
        setUrlError(
          "URL should point to a direct image file (jpg, png, webp...) or a res.cloudinary.com URL",
        );
        return;
      }
      setUrlError("");
      onSelect(url);
      onClose?.();
    } catch {
      setUrlError("Please enter a valid URL");
    }
  };

  const handleSelectImage = (src: string) => {
    setSelectedImage(src);
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      setSelectedImage(null);
      onClose?.();
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
        className={`bg-white w-full max-w-7xl flex flex-col overflow-hidden ${inline ? "h-[800px] border border-gray-200 rounded-lg shadow-sm" : "h-[92vh] rounded-2xl shadow-2xl"}`}
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-8 py-6 border-b gap-4 bg-white">
          <div className="flex flex-col">
            <h3 className="font-display text-2xl uppercase tracking-[4px]">
              Image Manager
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-[3px] mt-1">
              {uploadStatus || `${allImages.length} images in Cloudinary`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tab Switcher */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden mr-2">
              <button
                onClick={() => setActiveTab("browse")}
                className={`text-[10px] font-bold uppercase tracking-[2px] px-5 py-2.5 transition-all ${activeTab === "browse" ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"}`}
              >
                ☁️ Browse
              </button>
              <button
                onClick={() => setActiveTab("url")}
                className={`text-[10px] font-bold uppercase tracking-[2px] px-5 py-2.5 transition-all ${activeTab === "url" ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"}`}
              >
                🔗 Paste URL
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
            {!inline && onClose && (
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-black transition-colors font-bold p-2 text-xl ml-2"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tab: Browse */}
        {activeTab === "browse" && (
          <>
            {/* Search Bar */}
            <div className="px-8 py-4 bg-[#faf9f7] border-b">
              <input
                type="text"
                placeholder="Search images by filename..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
              />
            </div>

            {/* Image Grid */}
            <div className="overflow-y-auto px-8 py-6 flex-1 bg-gray-50 flex flex-col">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {displayed.map((src) => {
                    const isSelected = selectedImage === src;
                    const isLoading = loadingImages.has(src);
                    return (
                      <div
                        key={src}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? "ring-4 ring-[#b3a384] shadow-lg scale-95"
                            : "ring-2 ring-gray-200 hover:ring-black shadow-md hover:shadow-xl"
                        }`}
                        onClick={() => handleSelectImage(src)}
                      >
                        {/* Loading Skeleton */}
                        {isLoading && (
                          <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
                        )}

                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoadStart={() => handleImageLoadStart(src)}
                          onLoad={() => handleImageLoad(src)}
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
                        <div className="absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-all bg-white/90 border-black">
                          {isSelected && (
                            <span className="text-black text-sm font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* Selection Text */}
                        {isSelected && (
                          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center">
                            <p className="text-[10px] text-white uppercase tracking-[2px] font-bold drop-shadow-lg bg-black/50 px-3 py-1 rounded">
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

            {/* Selection Confirm Bar */}
            {selectedImage && (
              <div className="bg-gradient-to-r from-black to-[#b3a384] px-8 py-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-16 h-20 object-cover rounded-lg shadow-md"
                  />
                  <div>
                    <p className="text-white text-sm font-bold uppercase tracking-[2px]">
                      Image Selected
                    </p>
                    <p className="text-white/70 text-[10px] uppercase tracking-[1px] mt-1">
                      Click confirm to add this image
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-white text-[10px] font-bold uppercase tracking-[2px] px-6 py-3 border-2 border-white/30 rounded-lg hover:border-white transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="text-black text-[10px] font-bold uppercase tracking-[2px] px-8 py-3 bg-white rounded-lg hover:bg-[#b3a384] hover:text-white transition-all shadow-lg"
                  >
                    CONFIRM & ADD
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-6 px-8 py-5 border-t bg-white">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-6 py-2.5 border-2 rounded-lg text-[10px] uppercase tracking-[2px] hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-20 font-bold"
                >
                  ← PREV
                </button>
                <span className="text-xs font-bold tracking-[4px] text-gray-500">
                  {page + 1} / {total}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
                  disabled={page >= total - 1}
                  className="px-6 py-2.5 border-2 rounded-lg text-[10px] uppercase tracking-[2px] hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-20 font-bold"
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}

        {/* Tab: Paste URL */}
        {activeTab === "url" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#faf9f7]">
            <div className="w-full max-w-2xl space-y-8">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/5 mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h4 className="font-display text-lg uppercase tracking-[3px]">
                  Paste Image URL
                </h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-[2px] mt-2">
                  Enter a direct Cloudinary image URL (res.cloudinary.com/...)
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
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasteUrl();
                  }}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-6 py-4 text-base text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition-all font-mono"
                />
                <button
                  onClick={handlePasteUrl}
                  disabled={!pasteUrl.trim()}
                  className="text-[11px] font-bold uppercase tracking-[2px] px-8 py-4 bg-black text-white rounded-xl hover:bg-[#b3a384] transition-all disabled:opacity-20 disabled:cursor-not-allowed whitespace-nowrap shadow-lg hover:shadow-xl"
                >
                  USE THIS IMAGE
                </button>
              </div>

              {urlError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-xs font-medium">{urlError}</p>
                </div>
              )}

              {/* Large URL Preview */}
              {pasteUrl.trim() && !urlError && (
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg">
                  <div className="aspect-[4/3] relative bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pasteUrl.trim()}
                      alt="URL Preview"
                      className="w-full h-full object-contain"
                      onLoad={() => setUrlPreviewOk(true)}
                      onError={() => {
                        setUrlPreviewOk(false);
                      }}
                    />
                    {!urlPreviewOk && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <div className="text-center">
                          <span className="text-4xl block mb-2">🖼️</span>
                          <p className="text-[10px] uppercase tracking-[2px] font-bold">
                            Loading preview...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {urlPreviewOk && (
                    <div className="p-4 border-t bg-green-50">
                      <p className="text-green-700 text-[10px] uppercase tracking-[2px] font-bold">
                        ✓ Image loaded successfully — click &quot;USE THIS
                        IMAGE&quot; to select
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-[10px] text-gray-300 uppercase tracking-[2px]">
                  Tip: Right-click an image in Cloudinary → &quot;Copy image
                  address&quot; to get the direct URL
                </p>
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
  label,
}: {
  images: string[];
  allImages: string[];
  onChange: (imgs: string[]) => void;
  label: string;
}) {
  const [picker, setPicker] = useState(false);
  const add = (src: string) => onChange([...images, src]);
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
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
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
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              <button
                title="Remove"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 z-10 transition-opacity shadow-lg cursor-pointer"
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
  label,
}: {
  image: string;
  allImages: string[];
  onChange: (src: string) => void;
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
              src={image}
              alt="Preview"
              className="w-full h-full object-cover transition-transform hover:scale-110 duration-700"
              loading="lazy"
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
          onSelect={onChange}
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
            className="absolute top-4 right-4 bg-red-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("site");
  const [content, setContent] = useState<any>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedColIdx, setSelectedColIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/content").then((r) => r.json()),
      fetch("/api/images").then((r) => r.json()),
    ])
      .then(([c, imgs]) => {
        setContent(c);
        setAllImages(imgs.images ?? []);
        setLoading(false);
      })
      .catch(() => router.push("/admin"));
  }, [router]);

  const set = useCallback((path: string, value: any) => {
    setContent((prev: any) => {
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
        body: JSON.stringify(content),
      });
      if (res.ok) {
        alert("CHANGES SAVED SUCCESSFULLY!");
      } else {
        alert("FAILED TO SAVE CHANGES.");
      }
    } catch {
      alert("ERROR SAVING CHANGES.");
    } finally {
      setSaving(false);
    }
  };

  const addCollection = () => {
    const newCol = {
      title: "New Collection",
      slug: `new-collection-${Date.now()}`,
      images: [],
      category: "bridal",
    };
    const newCols = [...(content.collections ?? []), newCol];
    set("collections", newCols);
    setSelectedColIdx(newCols.length - 1);
  };

  const deleteCollection = (idx: number) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    const newCols = content.collections.filter(
      (_: any, i: number) => i !== idx,
    );
    set("collections", newCols);
    setSelectedColIdx(-1);
    setActiveSection("site");
  };

  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f9f7f4] z-50">
        <div className="text-center font-display uppercase tracking-[8px] text-gray-800 animate-pulse">
          Initializing Terminal...
        </div>
      </div>
    );

  const collections = content.collections ?? [];
  const bridalCollections = collections.filter(
    (c: any) => c.category === "bridal",
  );
  const labelCollections = collections.filter(
    (c: any) => c.category === "label",
  );

  return (
    <div className="flex min-h-screen bg-[#fcfaf9]">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-[60] md:hidden bg-black text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform"
      >
        {sidebarOpen ? "✕ CLOSE" : "☰ MENU"}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-96 bg-white border-r px-10 py-14 flex flex-col fixed md:sticky top-0 h-screen overflow-y-auto shadow-[10px_0_30px_rgba(0,0,0,0.03)] z-[55] transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-16 text-center">
          <div className="bg-black text-white inline-block px-6 py-3 mb-6">
            <p className="font-display tracking-[4px] uppercase text-base">
              COUTURE CMS
            </p>
          </div>
          <p className="text-[11px] text-gray-400 uppercase tracking-[6px] font-bold">
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
                "label",
                "contact",
                "media",
              ] as Section[]
            ).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setActiveSection(s);
                  setSelectedColIdx(-1);
                  setSidebarOpen(false);
                }}
                className={`w-full px-6 py-5 text-[10px] uppercase tracking-[2px] font-medium transition-all duration-300 rounded text-center cursor-pointer ${
                  activeSection === s && selectedColIdx === -1
                    ? "bg-black text-white shadow-lg translate-x-1"
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                {s === "label"
                  ? "THE LABEL"
                  : s === "about"
                    ? "THE DESIGNER"
                    : s === "media"
                      ? "MEDIA LIBRARY"
                      : s.toUpperCase().replace(/([A-Z])/g, " $1")}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-center py-6">
            <div className="pb-6 flex justify-center items-center gap-6">
              <p className="text-[10px] tracking-[4px] uppercase text-[#b3a384] font-black">
                Bridal Collections
              </p>
              <button
                onClick={addCollection}
                className="text-[22px] text-gray-400 hover:text-black transition-colors cursor-pointer hover:scale-125"
              >
                +
              </button>
            </div>
            <div className="space-y-2">
              {bridalCollections.map((c: any) => {
                const idx = collections.indexOf(c);
                return (
                  <button
                    key={c.slug}
                    onClick={() => {
                      setActiveSection("collections");
                      setSelectedColIdx(idx);
                      setSidebarOpen(false);
                    }}
                    className={`group w-full px-6 py-5 text-[10px] uppercase tracking-[2px] font-medium transition-all duration-300 rounded text-center cursor-pointer ${
                      activeSection === "collections" && selectedColIdx === idx
                        ? "bg-black text-white shadow-lg translate-x-1"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <p className="text-[10px] tracking-[4px] uppercase text-[#b3a384] font-black pb-4 text-center">
              The Label / Evening
            </p>
            <div className="space-y-2">
              {labelCollections.map((c: any) => {
                const idx = collections.indexOf(c);
                return (
                  <button
                    key={c.slug}
                    onClick={() => {
                      setActiveSection("collections");
                      setSelectedColIdx(idx);
                      setSidebarOpen(false);
                    }}
                    className={`w-full px-6 py-5 text-[10px] uppercase tracking-[2px] font-medium transition-all duration-300 rounded text-center cursor-pointer ${
                      activeSection === "collections" && selectedColIdx === idx
                        ? "bg-black text-white shadow-lg translate-x-1"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>
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
      <main className="flex-1 p-6 md:p-12 lg:p-24 overflow-y-auto bg-[#fcfaf9]">
        <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
          <header className="mb-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] tracking-[6px] uppercase text-[#b3a384] font-bold mb-3">
                Management Module
              </p>
              <h2 className="text-3xl md:text-4xl font-display uppercase tracking-wider text-black">
                {selectedColIdx !== -1
                  ? collections[selectedColIdx].title
                  : activeSection === "label"
                    ? "THE LABEL"
                    : activeSection === "about"
                      ? "THE DESIGNER"
                      : activeSection}
              </h2>
            </div>
            <div className="h-px flex-1 bg-gray-200 mx-10 mb-5 hidden lg:block"></div>
            <div className="text-[10px] tracking-[4px] uppercase text-gray-300 font-bold mb-5 whitespace-nowrap">
              Status: Ready
            </div>
          </header>

          {/* SITE SETTINGS */}
          {activeSection === "site" && (
            <div className="space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <SingleImageEditor
                  label="GLOBAL BRAND LOGO"
                  image={content.siteInfo?.logo ?? ""}
                  allImages={allImages}
                  onChange={(src) => set("siteInfo.logo", src)}
                />
              </div>

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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

              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <h3 className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 border-b pb-4">
                  Footer & Credits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-3 block">
                      Developer Link (URL)
                    </label>
                    <input
                      value={content.footer?.creditLink ?? ""}
                      onChange={(e) => set("footer.creditLink", e.target.value)}
                      className="admin-input py-3 font-mono text-sm cursor-text"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HOME SETTINGS */}
          {activeSection === "home" && (
            <div className="space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
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
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <SingleImageEditor
                  label="MAIN HERO BACKGROUND"
                  image={content.homepage?.heroImage ?? ""}
                  allImages={allImages}
                  onChange={(src) => set("homepage.heroImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <GalleryEditor
                  label="FEATURED COLLECTION PREVIEW"
                  images={content.homepage?.featuredImages ?? []}
                  allImages={allImages}
                  onChange={(imgs) => set("homepage.featuredImages", imgs)}
                />
              </div>
            </div>
          )}

          {/* ABOUT SETTINGS */}
          {activeSection === "about" && (
            <div className="space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
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
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                  <SingleImageEditor
                    label="PRIMARY PORTRAIT"
                    image={content.about?.portraitImage ?? ""}
                    allImages={allImages}
                    onChange={(src) => set("about.portraitImage", src)}
                  />
                </div>
                <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                  <SingleImageEditor
                    label="SECONDARY EDITORIAL"
                    image={content.about?.sideImage ?? ""}
                    allImages={allImages}
                    onChange={(src) => set("about.sideImage", src)}
                  />
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <BioParagraphEditor
                  bio={content.about?.bio ?? []}
                  onChange={(b) => set("about.bio", b)}
                />
              </div>
            </div>
          )}

          {/* LABEL SETTINGS */}
          {activeSection === "label" && (
            <div className="space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <label className="text-xs uppercase tracking-[3px] text-gray-400 font-bold mb-8 block">
                  The Label Page SEO
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input
                    value={content.theLabelPage?.metaTitle ?? ""}
                    onChange={(e) =>
                      set("theLabelPage.metaTitle", e.target.value)
                    }
                    className="admin-input cursor-text"
                    placeholder="Page Title (Browser Tab)"
                  />
                  <input
                    value={content.theLabelPage?.metaDescription ?? ""}
                    onChange={(e) =>
                      set("theLabelPage.metaDescription", e.target.value)
                    }
                    className="admin-input cursor-text"
                    placeholder="Meta Description"
                  />
                </div>
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <SingleImageEditor
                  label="OFFICIAL PAGE HERO"
                  image={content.theLabelPage?.heroImage ?? ""}
                  allImages={allImages}
                  onChange={(src) => set("theLabelPage.heroImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <GalleryEditor
                  label="LABEL EDITORIAL GALLERY"
                  images={content.theLabelPage?.gallery ?? []}
                  allImages={allImages}
                  onChange={(imgs) => set("theLabelPage.gallery", imgs)}
                />
              </div>
            </div>
          )}

          {/* COLLECTIONS SETTINGS */}
          {activeSection === "collections" && collections[selectedColIdx] && (
            <div className="space-y-12 animate-in slide-in-from-bottom-5">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16 border-b pb-12">
                  <div className="space-y-8 flex-1">
                    <div>
                      <label className="text-xs uppercase tracking-[3px] text-gray-300 font-bold block mb-3">
                        CATALOG TITLE
                      </label>
                      <input
                        value={collections[selectedColIdx].title}
                        onChange={(e) => {
                          const n = [...collections];
                          n[selectedColIdx].title = e.target.value;
                          set("collections", n);
                        }}
                        className="admin-input font-display text-2xl md:text-3xl py-2 cursor-text"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs uppercase tracking-[3px] text-gray-300 font-bold block mb-3">
                          URL SLUG (ID)
                        </label>
                        <input
                          value={collections[selectedColIdx].slug}
                          onChange={(e) => {
                            const n = [...collections];
                            n[selectedColIdx].slug = e.target.value;
                            set("collections", n);
                          }}
                          className="admin-input text-sm font-mono lowercase cursor-text"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-[3px] text-gray-300 font-bold block mb-3">
                          CATEGORY
                        </label>
                        <select
                          value={
                            collections[selectedColIdx].category ?? "bridal"
                          }
                          onChange={(e) => {
                            const n = [...collections];
                            n[selectedColIdx].category = e.target.value;
                            set("collections", n);
                          }}
                          className="admin-input text-xs font-bold uppercase tracking-widest cursor-pointer"
                        >
                          <option value="bridal">BRIDAL</option>
                          <option value="label">THE LABEL / EVENING</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCollection(selectedColIdx)}
                    className="text-red-400 text-[9px] tracking-[4px] uppercase font-bold hover:bg-red-50 px-6 py-2 rounded transition-colors self-start xl:self-end cursor-pointer"
                  >
                    DESTROY COLLECTION
                  </button>
                </header>
                <div className="mb-12">
                  <label className="text-xs uppercase tracking-[3px] text-gray-300 font-bold block mb-4">
                    Collection SEO
                  </label>
                  <input
                    value={collections[selectedColIdx].metaDescription ?? ""}
                    onChange={(e) => {
                      const n = [...collections];
                      n[selectedColIdx].metaDescription = e.target.value;
                      set("collections", n);
                    }}
                    className="admin-input text-sm cursor-text"
                    placeholder="SEO Description specifically for this collection..."
                  />
                </div>
                <GalleryEditor
                  label="CATALOG ASSETS"
                  images={collections[selectedColIdx].images ?? []}
                  allImages={allImages}
                  onChange={(imgs) => {
                    const newCols = [...collections];
                    newCols[selectedColIdx].images = imgs;
                    set("collections", newCols);
                  }}
                />
              </div>
            </div>
          )}

          {/* CONTACT SETTINGS */}
          {activeSection === "contact" && (
            <div className="space-y-12">
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
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
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <SingleImageEditor
                  label="CONTACT HERO BACKGROUND"
                  image={content.contact?.heroImage ?? ""}
                  allImages={allImages}
                  onChange={(src) => set("contact.heroImage", src)}
                />
              </div>
              <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
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
                              const ph = [...content.contact.phones];
                              ph[i] = e.target.value;
                              set("contact.phones", ph);
                            }}
                            className="admin-input text-lg font-light tracking-widest"
                          />
                          <button
                            onClick={() => {
                              const ph = content.contact.phones.filter(
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
            <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-6 md:p-12">
              <div className="space-y-12">
                {["instagram", "facebook", "whatsapp", "pinterest"].map((s) => (
                  <div key={s} className="relative">
                    <label className="text-[10px] uppercase tracking-[5px] text-gray-400 font-bold mb-4 block">
                      {s}
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full font-bold text-xs uppercase">
                        {s[0]}
                      </div>
                      <input
                        value={content.social?.[s] ?? ""}
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
            <div className="admin-card border-none shadow-[0_20px_60px_rgba(0,0,0,0.05)] p-0">
              <ImagePicker
                allImages={allImages}
                onSelect={(url) => {
                  navigator.clipboard.writeText(url);
                  alert("Image URL copied to clipboard!");
                }}
                inline={true}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
