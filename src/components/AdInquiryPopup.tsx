"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  category: string;
  eventDate: string;
  silhouette: string;
  designDetails: string;
  investmentTier: string;
}

const EMPTY: FormData = {
  fullName: "", phone: "", email: "", category: "",
  eventDate: "", silhouette: "", designDetails: "", investmentTier: "",
};

const STEPS = [
  { num: 1, label: "Identity" },
  { num: 2, label: "Timeline" },
  { num: 3, label: "Vision" },
  { num: 4, label: "Investment" },
];

const SILHOUETTES = [
  "Signature Ballgown",
  "Structured Mermaid Silhouette",
  "Silhouette with Detachable Dramatic Extension",
  "Sleek Column / Elegant A-Line",
  "Completely Custom / Undecided",
];

const TIERS = [
  "85,000 EGP – 120,000 EGP",
  "120,000 EGP – 200,000 EGP",
  "200,000 EGP+",
  "Evening Couture: My investment aligns with haute couture pricing standards.",
];

function RadioOption({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-start gap-3 px-4 py-4 border text-left transition-all duration-200 active:scale-[0.99] ${
        checked
          ? "border-[#b3a384] bg-[#b3a384]/6"
          : "border-[#e5e0d8] bg-white hover:border-[#b3a384]/50"
      }`}
    >
      <div
        className={`w-5 h-5 border-2 shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200 ${
          checked ? "border-[#b3a384]" : "border-[#c8c0b4]"
        }`}
      >
        {checked && <div className="w-2.5 h-2.5 bg-[#b3a384]" />}
      </div>
      <span
        className={`text-[13px] sm:text-sm leading-relaxed font-serif transition-colors duration-200 ${
          checked ? "text-[#1a1a1a]" : "text-[#555]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function PopupInner() {
  const params = useSearchParams();
  const fromAd = params.get("ref") === "ad";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>(EMPTY);

  useEffect(() => {
    if (fromAd) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [fromAd]);

  if (!fromAd || !open) return null;

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function canProceed() {
    if (step === 1) return !!(form.fullName.trim() && form.phone.trim() && form.email.trim());
    if (step === 2) return !!(form.category && form.eventDate);
    if (step === 3) return !!form.silhouette;
    if (step === 4) return !!form.investmentTier;
    return false;
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/ad-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again or contact us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full border border-[#e5e0d8] bg-white text-[#1a1a1a] text-[15px] px-4 py-4 outline-none focus:border-[#b3a384] placeholder-[#bbb] transition-colors duration-200 font-serif rounded-none appearance-none";

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm">
      {/* Card — full width on mobile, constrained on desktop */}
      <div
        className="relative w-full sm:max-w-[540px] sm:mx-4 bg-[#faf8f5] border-t border-[#e5e0d8] sm:border border-[#e5e0d8] shadow-2xl flex flex-col animate-slideUp sm:animate-fadeIn"
        style={{ maxHeight: "94dvh", overflowY: "auto" }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 sm:px-8 pt-5 pb-4 border-b border-[#e5e0d8] bg-white shrink-0">
          <div>
            <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-bold leading-none mb-1">
              Ahmed Elakad
            </p>
            <h2 className="font-display text-[15px] sm:text-lg uppercase tracking-[0.15em] text-[#1a1a1a] leading-none">
              {done ? "Enquiry Confirmed" : "Private Atelier Enquiry"}
            </h2>
          </div>
          {!done && (
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center text-[#999] hover:text-[#1a1a1a] transition-colors text-lg leading-none shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Progress ── */}
        {!done && (
          <div className="flex items-center px-5 sm:px-8 py-4 bg-white border-b border-[#e5e0d8] shrink-0">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                      step === s.num
                        ? "bg-[#b3a384] text-white"
                        : step > s.num
                        ? "bg-[#b3a384]/20 text-[#b3a384]"
                        : "bg-[#f0ece6] text-[#b3a384]/50"
                    }`}
                  >
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-[7px] tracking-[2px] uppercase font-bold transition-colors duration-300 hidden sm:block ${
                      step === s.num ? "text-[#b3a384]" : "text-[#ccc]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-2 transition-all duration-300 ${
                      step > s.num ? "bg-[#b3a384]/40" : "bg-[#e5e0d8]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Body ── */}
        <div className="px-5 sm:px-8 py-6 flex-1">
          {done ? (
            /* Thank you */
            <div className="text-center py-8 sm:py-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-[#b3a384]/40 flex items-center justify-center mx-auto mb-5">
                <span className="text-[#b3a384] text-xl">✦</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl uppercase tracking-[0.15em] text-[#1a1a1a] mb-3">
                Thank You, {form.fullName.split(" ")[0]}
              </h3>
              <div className="w-8 h-px bg-[#b3a384] mx-auto mb-4" />
              <p className="text-[#666] text-[13px] sm:text-sm leading-[1.85] font-serif max-w-[340px] mx-auto">
                Your enquiry has been received. A member of the Ahmed Elakad
                atelier will be in touch within 48 hours to arrange your private
                design consultation.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-8 text-[9px] tracking-[4px] uppercase text-[#b3a384] hover:text-[#1a1a1a] transition-colors border border-[#b3a384]/30 hover:border-[#1a1a1a]/30 px-8 py-3.5 w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          ) : step === 1 ? (
            /* Step 1 */
            <div className="space-y-5">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-bold mb-6">
                Step 01 — Identity &amp; Contact
              </p>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-2">
                  Full Name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-2">
                  Phone Number (incl. Country Code)
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+20 10 0000 0000"
                  type="tel"
                  autoComplete="tel"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-2">
                  Email Address
                </label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  autoComplete="email"
                  className={inputCls}
                />
              </div>
            </div>
          ) : step === 2 ? (
            /* Step 2 */
            <div className="space-y-6">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-bold">
                Step 02 — Collection &amp; Timeline
              </p>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-3">
                  Couture Category
                </label>
                <div className="space-y-2.5">
                  <RadioOption
                    label="Bridal Couture"
                    checked={form.category === "bridal"}
                    onSelect={() => set("category", "bridal")}
                  />
                  <RadioOption
                    label="Evening Haute Couture"
                    checked={form.category === "evening"}
                    onSelect={() => set("category", "evening")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-2">
                  Wedding / Event Date
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="border-l-2 border-[#b3a384] bg-white px-4 py-4">
                <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-2">
                  Atelier Note
                </p>
                <p className="text-[#888] text-[12px] sm:text-[13px] leading-[1.85] font-serif">
                  Custom wedding gowns require a minimum 4–5 month production
                  window. Simple custom designs and evening couture require 2–3
                  months. Rush fees may apply depending on atelier calendar
                  capacity.
                </p>
              </div>
            </div>
          ) : step === 3 ? (
            /* Step 3 */
            <div className="space-y-6">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-bold">
                Step 03 — Sartorial Vision &amp; Silhouette
              </p>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-3">
                  Preferred Gown Silhouette
                </label>
                <div className="space-y-2.5">
                  {SILHOUETTES.map((opt) => (
                    <RadioOption
                      key={opt}
                      label={opt}
                      checked={form.silhouette === opt}
                      onSelect={() => set("silhouette", opt)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-2">
                  Design Details &amp; Vision
                  <span className="ml-2 normal-case tracking-normal text-[#ccc] text-[8px]">
                    Optional
                  </span>
                </label>
                <textarea
                  value={form.designDetails}
                  onChange={(e) => set("designDetails", e.target.value)}
                  rows={4}
                  placeholder="Please share any specific design elements you are drawn to (e.g., textured bodices, intricate leaf-like embroidery, specific fabrics)."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          ) : (
            /* Step 4 */
            <div className="space-y-6">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-bold">
                Step 04 — Investment Realization
              </p>
              <div className="border-l-2 border-[#b3a384] bg-white px-4 py-4">
                <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-2">
                  Investment Alignment
                </p>
                <p className="text-[#888] text-[12px] sm:text-[13px] leading-[1.85] font-serif">
                  To maintain an uncompromising standard of manual artistry,
                  custom bridal gowns require an investment starting from 85,000
                  EGP. Final pricing is determined following a private design
                  consultation.
                </p>
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-[#999] font-bold mb-3">
                  Preferred Investment Tier
                </label>
                <div className="space-y-2.5">
                  {TIERS.map((opt) => (
                    <RadioOption
                      key={opt}
                      label={opt}
                      checked={form.investmentTier === opt}
                      onSelect={() => set("investmentTier", opt)}
                    />
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-red-500 text-xs font-serif">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!done && (
          <div className="px-5 sm:px-8 pb-6 pt-4 border-t border-[#e5e0d8] bg-white flex items-center justify-between gap-4 shrink-0">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-[9px] tracking-[3px] uppercase text-[#999] hover:text-[#1a1a1a] transition-colors py-2"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => { if (canProceed()) setStep((s) => s + 1); }}
                disabled={!canProceed()}
                className="text-[9px] tracking-[4px] uppercase px-7 py-4 bg-[#1a1a1a] text-white font-bold hover:bg-[#b3a384] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed min-w-[140px] text-center"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canProceed() || submitting}
                className="text-[9px] tracking-[4px] uppercase px-7 py-4 bg-[#1a1a1a] text-white font-bold hover:bg-[#b3a384] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2.5 min-w-[160px] justify-center"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting
                  </>
                ) : (
                  "Submit Enquiry"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdInquiryPopup() {
  return (
    <Suspense fallback={null}>
      <PopupInner />
    </Suspense>
  );
}
