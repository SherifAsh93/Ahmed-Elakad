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
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
      <div className="space-y-6">
        <div>
          <input
            type="text"
            placeholder="Name"
            required
            disabled={status === "loading"}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white border-none px-6 py-6 outline-none focus:bg-stone-50 transition-colors font-light text-stone-700 placeholder:text-stone-300 text-base shadow-sm"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            required
            disabled={status === "loading"}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-white border-none px-6 py-6 outline-none focus:bg-stone-50 transition-colors font-light text-stone-700 placeholder:text-stone-300 text-base shadow-sm"
          />
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone"
            disabled={status === "loading"}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-white border-none px-6 py-6 outline-none focus:bg-stone-50 transition-colors font-light text-stone-700 placeholder:text-stone-300 text-base shadow-sm"
          />
        </div>
        <div>
          <textarea
            placeholder="Message"
            required
            rows={8}
            disabled={status === "loading"}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-white border-none px-6 py-6 outline-none focus:bg-stone-50 transition-colors font-light text-stone-700 placeholder:text-stone-300 text-base shadow-sm resize-none"
          ></textarea>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-black text-white py-6 px-8 flex items-center justify-center transition-all hover:bg-stone-900 active:scale-[0.99] disabled:bg-stone-400 shadow-md"
        >
          {status === "loading" ? (
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Processing...</span>
          ) : (
            <span className="font-serif italic text-2xl tracking-[0.1em] lowercase">submit</span>
          )}
        </button>

        {status === "success" && (
          <p className="text-green-600 text-center text-[10px] uppercase tracking-[0.3em] font-bold mt-6">
            ✓ Message Delivered
          </p>
        )}
        {status === "error" && (
          <p className="text-red-500 text-center text-[10px] uppercase tracking-[0.3em] font-bold mt-6">
            ⚠ Connection Failed
          </p>
        )}
      </div>
    </form>
  );
}
