"use client";

import { useState } from "react";

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  category: string;
  eventDate: string;
  silhouette: string;
  designDetails: string;
}

const EMPTY: FormData = {
  fullName: "", phone: "", email: "", category: "",
  eventDate: "", silhouette: "", designDetails: "",
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

export default function AtelierForm() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>(EMPTY);

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function canProceed() {
    if (step === 1) return !!(form.fullName.trim() && form.phone.trim() && form.email.trim());
    if (step === 2) return !!(form.category && form.eventDate);
    if (step === 3) return !!form.silhouette;
    if (step === 4) return true;
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

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full border border-[#b3a384]/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-[#b3a384] text-xl">✦</span>
        </div>
        <h3 className="font-display text-xl uppercase tracking-[0.15em] text-[#1a1a1a] mb-3">
          Thank You, {form.fullName.split(" ")[0]}
        </h3>
        <div className="w-8 h-px bg-[#b3a384] mx-auto mb-4" />
        <p className="text-[#666] text-[13px] leading-[1.85] font-serif max-w-[340px] mx-auto">
          Your enquiry has been received. A member of the Ahmed Elakad atelier
          will be in touch within 48 hours to arrange your private design
          consultation.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step header */}
      <h2 className="font-display text-xl uppercase tracking-[0.2em] text-[#1a1a1a] mb-2">
        Private Atelier Enquiry
      </h2>
      <div className="w-8 h-px bg-[#b3a384] mb-6" />

      {/* Progress */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
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

      {/* Body */}
      <div className="mb-8">
        {step === 1 ? (
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
            <div className="border-l-2 border-[#b3a384] bg-[#faf8f5] px-4 py-4">
              <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-2">
                Atelier Note
              </p>
              <p className="text-[#888] text-[12px] sm:text-[13px] leading-[1.85] font-serif">
                Each bespoke bridal gown is meticulously handcrafted, requiring
                a four to five-month creation period. For custom classic
                silhouette bridal and evening haute couture, please allow two to
                three months. Should your timeline require immediate priority,
                expedited requests may be accommodated depending on current
                atelier capacity.
              </p>
            </div>
          </div>
        ) : step === 3 ? (
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
          <div className="space-y-6">
            <p className="text-[8px] tracking-[5px] uppercase text-[#b3a384] font-bold">
              Step 04 — Investment Realization
            </p>
            <div className="border-l-2 border-[#b3a384] bg-[#faf8f5] px-4 py-4">
              <p className="text-[8px] tracking-[3px] uppercase text-[#b3a384] font-bold mb-2">
                Investment Alignment
              </p>
              <p className="text-[#888] text-[12px] sm:text-[13px] leading-[1.85] font-serif">
                Reflecting our dedication to high-fashion construction, custom
                bridal investments are tailored by silhouette: mermaid
                silhouettes begin at 85,000 EGP, gowns with detachable
                extensions at 120,000 EGP, and grand ballgowns at 150,000 EGP.
                Final pricing is determined following your private appointment.
              </p>
            </div>
            {error && (
              <p className="text-red-500 text-xs font-serif">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#e5e0d8]">
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
            disabled={submitting}
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
    </div>
  );
}
