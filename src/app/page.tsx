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
    phone: "",
    company: "",
    designation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── Left Panel ─── */}
      <div className="relative lg:w-[42%] bg-[#0a0a0a] bg-dot-grid flex flex-col justify-between overflow-hidden min-h-[260px] lg:min-h-screen">
        {/* Decorative rings */}
        <div className="absolute -top-40 -right-40 w-96 h-96 border border-[#c4952a]/[0.08] rounded-full pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-56 h-56 border border-[#c4952a]/[0.06] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 border border-[#c4952a]/[0.06] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-px h-40 bg-gradient-to-b from-transparent via-[#c4952a]/15 to-transparent pointer-events-none" />

        {/* Top brand mark */}
        <div className="relative z-10 pt-10 px-10 lg:pt-14 lg:px-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-px bg-[#c4952a]" />
            <span className="text-[#c4952a] text-[10px] tracking-[0.45em] uppercase font-medium">
              Exclusive Event
            </span>
          </div>
        </div>

        {/* Center hero text */}
        <div className="relative z-10 px-10 py-10 lg:px-14">
          <h1 className="font-display text-white text-4xl lg:text-5xl xl:text-[3.5rem] leading-[1.05] mb-6">
            Reserve Your<br />
            <span className="italic text-[#c4952a]/90">Invitation</span>
          </h1>
          <div className="w-12 h-0.5 bg-[#c4952a] mb-6" />
          <p className="text-white/35 text-sm lg:text-[15px] leading-relaxed max-w-xs">
            An exclusive evening of exceptional properties and curated real estate insights.
          </p>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 pb-10 px-10 lg:pb-12 lg:px-14">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a] animate-pulse-gold" />
            <p className="text-white/25 text-xs tracking-wide">
              Your QR pass will be delivered to your inbox
            </p>
          </div>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 bg-[#faf7f2] flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 xl:px-20">
          <div className="w-full max-w-[440px] animate-fade-in-up">

            {/* Form header */}
            <div className="mb-9">
              <div className="inline-flex items-center gap-2 border border-[#c4952a]/30 rounded-full px-3.5 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c4952a] animate-pulse-gold" />
                <span className="text-[#c4952a] text-[10px] tracking-[0.35em] uppercase font-semibold">
                  Registration Open
                </span>
              </div>
              <h2 className="font-display text-[#0a0a0a] text-3xl lg:text-[2rem] mb-2.5">
                Complete Your Details
              </h2>
              <p className="text-[#8a7f6e] text-sm leading-relaxed">
                Fill in your information to receive your exclusive digital pass
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                    First Name <span className="text-[#c4952a]">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="input-luxury"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                    Last Name <span className="text-[#c4952a]">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="input-luxury"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                  Email Address <span className="text-[#c4952a]">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  className="input-luxury"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                  Mobile Number <span className="text-[#c4952a]">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+971 50 000 0000"
                  className="input-luxury"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                  Company / Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Your company"
                  className="input-luxury"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                  Designation / Role
                </label>
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="Your position"
                  className="input-luxury"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0a0a0a] text-white text-sm font-medium tracking-[0.06em] py-[1.05rem] rounded-lg hover:bg-[#1a1a1a] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Register &amp; Receive QR Pass
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-[#a89e8a] text-xs mt-3 tracking-wide">
                  By registering, you agree to receive event communications
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer row */}
        <div className="py-4 px-8 flex items-center justify-between border-t border-[#e8e2d5]">
          <span className="text-[#c4b89a] text-xs tracking-wider">© Exclusive Event 2025</span>
          <Link
            href="/admin"
            className="text-[#a89e8a] hover:text-[#0a0a0a] text-xs tracking-wider transition-colors"
          >
            Admin →
          </Link>
        </div>
      </div>
    </div>
  );
}
