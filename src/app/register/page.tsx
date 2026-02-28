"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.email.toLowerCase().trim().endsWith("@wasl.ae")) {
      setError("Registration is restricted to @wasl.ae email addresses.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(`/success?id=${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-4 sm:py-5 border-b border-[#f0ead8]">
        <Link href="/" className="hover:opacity-70 transition-opacity">
          <img src="/wasl-logo.png" alt="wasl" className="h-7 sm:h-8 w-auto" />
        </Link>
        <span className="text-[#8a7f6e] text-[11px] sm:text-xs tracking-[0.3em] uppercase font-medium">
          Registration
        </span>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-md animate-fade-in-up">

          {/* Heading */}
          <div className="mb-8 sm:mb-10">
            <h1 className="text-[#1a1a1a] font-bold text-2xl sm:text-3xl leading-tight mb-3">
              Suhoor Gathering
            </h1>
            <p className="text-[#8a7f6e] text-sm leading-relaxed">
              Enter your details below to register. A QR code will be sent to your email for check-in at the venue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                  First Name <span className="text-[#c4952a]">*</span>
                </label>
                <input
                  type="text" name="firstName" required
                  value={form.firstName} onChange={handleChange}
                  placeholder="First name"
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                  Last Name <span className="text-[#c4952a]">*</span>
                </label>
                <input
                  type="text" name="lastName" required
                  value={form.lastName} onChange={handleChange}
                  placeholder="Last name"
                  className="input-luxury"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                Email Address <span className="text-[#c4952a]">*</span>
              </label>
              <input
                type="email" name="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@wasl.ae"
                className="input-luxury"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-600 text-sm leading-snug">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c4952a] text-white font-bold text-sm tracking-[0.1em] uppercase py-4 rounded-full hover:bg-[#d4a844] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>

            <p className="text-center text-[#b8b0a0] text-xs mt-2">
              Your QR pass will be emailed to you upon registration.
            </p>
          </form>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-[#8a7f6e] hover:text-[#c4952a] text-sm transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to invitation
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-5 text-center border-t border-[#f0ead8]">
        <span className="text-[#b8b0a0] text-[10px] tracking-[0.3em] uppercase">
          Wasl Suhoor Gathering 2026
        </span>
      </footer>
    </div>
  );
}
