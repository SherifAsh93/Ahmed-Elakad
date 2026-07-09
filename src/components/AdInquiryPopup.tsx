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
  "For Evening Couture: My evening wear investment aligns with haute couture pricing standards.",
];

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-all duration-200 ${
        checked ? "border-[#b3a384]" : "border-white/20"
      }`}
    >
      {checked && <div className="w-2 h-2 bg-[#b3a384]" />}
    </div>
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
    "w-full bg-transparent border border-white/10 text-white text-sm px-4 py-3.5 outline-none focus:border-[#b3a384]/60 placeholder-white/20 transition-colors duration-200 font-serif";

  const optionCls = (selected: boolean) =>
    `flex items-center gap-3 px-4 py-3.5 border cursor-pointer transition-all duration-200 ${
      selected
        ? "border-[#b3a384]/50 bg-[#b3a384]/8"
        : "border-white/10 hover:border-white/25 hover:bg-white/3"
    }`;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-[520px] bg-[#080808] border border-white/8 shadow-[0_40px_120px_rgba(0,0,0,0.9)] animate-fadeIn"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Close */}
        {!done && (
          <button
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 z-10 w-7 h-7 flex items-center justify-center text-white/25 hover:text-white/70 transition-colors text-sm"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="border-b border-white/6 px-7 sm:px-10 pt-8 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-px h-5 bg-[#b3a384]" />
            <p className="text-[8px] tracking-[6px] uppercase text-[#b3a384] font-bold">
              Ahmed Elakad
            </p>
          </div>
          <h2 className="font-display text-xl sm:text-2xl uppercase tracking-[0.18em] text-white leading-tight">
            {done ? "Enquiry Received" : "Private Atelier Enquiry"}
          </h2>

          {/* Step progress */}
          {!done && (
            <div className="flex items-center gap-0 mt-6">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-400 ${
                        step === s.num
                          ? "bg-[#b3a384] text-black scale-110"
                          : step > s.num
                          ? "bg-[#b3a384]/25 text-[#b3a384]"
                          : "bg-white/5 text-white/20"
                      }`}
                    >
                      {step > s.num ? "✓" : s.num}
                    </div>
                    <span
                      className={`text-[7px] tracking-[2px] uppercase transition-colors duration-300 ${
                        step === s.num ? "text-[#b3a384]" : "text-white/15"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px w-10 sm:w-14 mx-1 mb-4 transition-all duration-400 ${
                        step > s.num ? "bg-[#b3a384]/35" : "bg-white/6"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-7 sm:px-10 py-7">
          {done ? (
            /* ── Thank you ── */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full border border-[#b3a384]/30 flex items-center justify-center mx-auto mb-6">
                <span className="text-[#b3a384] text-xl">✦</span>
              </div>
              <p className="text-white/60 text-[11px] tracking-[3px] uppercase mb-1">
                Confirmation
              </p>
              <h3 className="font-display text-2xl uppercase tracking-[0.18em] text-white mb-4">
                Thank You, {form.fullName.split(" ")[0]}
              </h3>
              <div className="w-8 h-px bg-[#b3a384] mx-auto mb-5" />
              <p className="text-white/45 text-[13px] leading-relaxed font-serif">
                Your enquiry has been received. A member of the Ahmed Elakad
                atelier will be in touch within 48 hours to arrange your private
                design consultation.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-8 text-[9px] tracking-[4px] uppercase text-[#b3a384] hover:text-white transition-colors border border-[#b3a384]/25 hover:border-white/25 px-8 py-3"
              >
                Close
              </button>
            </div>
          ) : step === 1 ? (
            /* ── Step 1 ── */
            <div className="space-y-5">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384]/80 font-bold mb-6">
                Step 01 — Identity &amp; Contact
              </p>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-2">
                  Full Name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Your full name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-2">
                  Phone Number (incl. Country Code)
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+20 10 0000 0000"
                  type="tel"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-2">
                  Email Address
                </label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className={inputCls}
                />
              </div>
            </div>
          ) : step === 2 ? (
            /* ── Step 2 ── */
            <div className="space-y-6">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384]/80 font-bold">
                Step 02 — Collection &amp; Timeline
              </p>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-3">
                  Couture Category
                </label>
                <div className="space-y-2">
                  {[
                    { val: "bridal", label: "Bridal Couture" },
                    { val: "evening", label: "Evening Haute Couture" },
                  ].map((opt) => (
                    <label
                      key={opt.val}
                      className={optionCls(form.category === opt.val)}
                      onClick={() => set("category", opt.val)}
                    >
                      <CheckBox checked={form.category === opt.val} />
                      <span className="text-white/80 text-sm font-serif">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-2">
                  Wedding / Event Date
                </label>
                <input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                  className={inputCls}
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div className="border-l-2 border-[#b3a384]/40 bg-white/2 pl-5 pr-4 py-4">
                <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-2">
                  Atelier Note
                </p>
                <p className="text-white/40 text-[11px] leading-[1.8] font-serif">
                  Custom wedding gowns require a minimum 4–5 month production
                  window. Simple custom designs and evening couture require 2–3
                  months. If your date falls within this window, please note that
                  rush fees may apply depending on atelier calendar capacity.
                </p>
              </div>
            </div>
          ) : step === 3 ? (
            /* ── Step 3 ── */
            <div className="space-y-6">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384]/80 font-bold">
                Step 03 — Sartorial Vision &amp; Silhouette
              </p>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-3">
                  Preferred Gown Silhouette
                </label>
                <div className="space-y-2">
                  {SILHOUETTES.map((opt) => (
                    <label
                      key={opt}
                      className={optionCls(form.silhouette === opt)}
                      onClick={() => set("silhouette", opt)}
                    >
                      <CheckBox checked={form.silhouette === opt} />
                      <span className="text-white/80 text-sm font-serif">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-2">
                  Design Details &amp; Vision
                  <span className="ml-2 normal-case tracking-normal text-white/20 text-[8px]">
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
            /* ── Step 4 ── */
            <div className="space-y-6">
              <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384]/80 font-bold">
                Step 04 — Investment Realization
              </p>
              <div className="border-l-2 border-[#b3a384]/40 bg-white/2 pl-5 pr-4 py-4">
                <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-2">
                  Investment Alignment
                </p>
                <p className="text-white/40 text-[11px] leading-[1.8] font-serif">
                  To maintain an uncompromising standard of manual artistry,
                  custom bridal gowns require an investment starting from 85,000
                  EGP. Final pricing is determined following a private design
                  consultation with Ahmed Elakad.
                </p>
              </div>
              <div>
                <label className="block text-[9px] tracking-[3px] uppercase text-white/35 font-bold mb-3">
                  Please select your preferred investment tier
                </label>
                <div className="space-y-2">
                  {TIERS.map((opt) => (
                    <label
                      key={opt}
                      className={optionCls(form.investmentTier === opt)}
                      onClick={() => set("investmentTier", opt)}
                    >
                      <CheckBox checked={form.investmentTier === opt} />
                      <span className="text-white/80 text-sm font-serif leading-relaxed">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-red-400/80 text-xs font-serif">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="px-7 sm:px-10 pb-8 pt-2 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-[9px] tracking-[3px] uppercase text-white/25 hover:text-white/60 transition-colors"
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
                className="text-[9px] tracking-[4px] uppercase px-8 py-3.5 bg-[#b3a384] text-black font-bold hover:bg-white transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canProceed() || submitting}
                className="text-[9px] tracking-[4px] uppercase px-8 py-3.5 bg-[#b3a384] text-black font-bold hover:bg-white transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-2.5"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
