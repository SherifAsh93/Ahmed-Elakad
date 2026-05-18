"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-5 md:space-y-6">
      <div className="space-y-4 md:space-y-5">
        <div>
          <input
            type="text"
            placeholder="Name"
            required
            disabled={status === "loading"}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white border border-[#e5e5e5] px-6 py-5 md:py-6 outline-none focus:border-[#b3a384] transition-all font-light text-[#333] placeholder:text-[#bbb] text-sm md:text-base"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Email (optional)"
            disabled={status === "loading"}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-white border border-[#e5e5e5] px-6 py-5 md:py-6 outline-none focus:border-[#b3a384] transition-all font-light text-[#333] placeholder:text-[#bbb] text-sm md:text-base"
          />
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone"
            disabled={status === "loading"}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-white border border-[#e5e5e5] px-6 py-5 md:py-6 outline-none focus:border-[#b3a384] transition-all font-light text-[#333] placeholder:text-[#bbb] text-sm md:text-base"
          />
        </div>
        <div>
          <textarea
            placeholder="Message"
            required
            rows={6}
            disabled={status === "loading"}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-white border border-[#e5e5e5] px-6 py-5 md:py-6 outline-none focus:border-[#b3a384] transition-all font-light text-[#333] placeholder:text-[#bbb] text-sm md:text-base resize-none"
          ></textarea>
        </div>
      </div>

      <div className="pt-2 md:pt-4">
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[#b3a384] text-[#0d0d0d] py-5 md:py-6 px-8 flex items-center justify-center transition-all hover:bg-[#c4b598] active:scale-[0.99] disabled:opacity-50"
        >
          {status === "loading" ? (
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Processing...</span>
          ) : (
            <span className="font-serif italic text-xl md:text-2xl tracking-[0.1em] lowercase">submit</span>
          )}
        </button>

        {status === "success" && (
          <p className="text-[#b3a384] text-center text-[10px] uppercase tracking-[0.3em] font-bold mt-4 md:mt-6 animate-pulse">
            ✓ Message Delivered
          </p>
        )}
        {status === "error" && (
          <p className="text-red-400 text-center text-[10px] uppercase tracking-[0.3em] font-bold mt-4 md:mt-6">
            ⚠ Connection Failed
          </p>
        )}
      </div>
    </form>
  );
}
