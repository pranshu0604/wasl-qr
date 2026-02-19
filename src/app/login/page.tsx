"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Set the cookie and verify
    document.cookie = `admin_secret=${encodeURIComponent(secret)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;

    const res = await fetch("/api/attendees?limit=1");

    if (res.ok) {
      router.push("/admin");
    } else {
      document.cookie = "admin_secret=; path=/; max-age=0";
      setError("Invalid admin password. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-charcoal-900 px-8 py-8 text-center">
            <h1 className="font-display text-gold-400 text-xl tracking-[0.15em] uppercase">
              Admin Access
            </h1>
            <p className="text-charcoal-400 text-sm mt-2">
              Enter the admin password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={secret}
                onChange={(e) => { setSecret(e.target.value); setError(""); }}
                placeholder="Enter password"
                className="input-luxury"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center"
            >
              {loading ? "Verifying..." : "Enter Admin Panel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
