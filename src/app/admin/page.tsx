"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img
              src="https://res.cloudinary.com/dzppk5ylt/image/upload/v1777839570/main_logo_q0hdny.png"
              alt="Ahmed Elakad"
              className="w-20 h-20 brightness-[2] invert opacity-90"
            />
          </div>
          <p className="font-display text-2xl text-white tracking-widest">
            AHMED ELAKAD
          </p>
          <p className="text-[10px] tracking-[4px] text-[#b8965a] uppercase mt-1">
            Admin Panel
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] tracking-[3px] text-white/50 uppercase mb-3">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#b8965a] transition-colors placeholder-white/20"
              placeholder="Enter admin password"
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs tracking-wide text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#b8965a] hover:bg-[#8a6e3e] text-white py-3 text-xs tracking-[3px] uppercase font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Enter"}
          </button>
        </form>

        <p className="text-center text-white/20 text-[10px] tracking-widest uppercase mt-12">
          Ahmed Elakad Couture · Admin
        </p>
      </div>
    </div>
  );
}
