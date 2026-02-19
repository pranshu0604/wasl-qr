"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "@/components/PhoneInput";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
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

  const handlePhoneChange = (fullNumber: string, isValid: boolean) => {
    setForm((prev) => ({ ...prev, phone: fullNumber }));
    setPhoneValid(isValid);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid) {
      setError("Please enter a valid phone number for your country.");
      return;
    }
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

      {/* LEFT PANEL */}
      <div className="relative lg:w-[45%] bg-[#080808] flex flex-col justify-between overflow-hidden min-h-[200px] sm:min-h-[260px] lg:min-h-screen">

        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#c4952a]/35 to-transparent pointer-events-none" />

        <div
          className="absolute bottom-0 right-0 font-display font-bold text-white select-none pointer-events-none leading-none"
          style={{ fontSize: "clamp(8rem, 22vw, 22rem)", opacity: 0.025, transform: "translate(15%, 10%)" }}
          aria-hidden
        >
          25
        </div>

        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #c4952a 0, #c4952a 1px, transparent 0, transparent 50%)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top brand mark */}
        <div className="relative z-10 pt-6 px-6 sm:pt-10 sm:px-10 lg:pt-14 lg:px-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-[#c4952a]" />
            <span className="text-[#c4952a] text-[9px] tracking-[0.55em] uppercase font-semibold">
              Exclusive Event
            </span>
          </div>
        </div>

        {/* Hero typography */}
        <div className="relative z-10 px-6 pb-6 sm:px-10 sm:pb-10 lg:px-14 lg:pb-14">
          <h1
            className="font-display text-white leading-[0.9] mb-5 sm:mb-8"
            style={{ fontSize: "clamp(2.8rem, 10vw, 6.5rem)" }}
          >
            Reserve<br />
            Your<br />
            <em className="not-italic text-[#c4952a]">Invitation.</em>
          </h1>

          <div className="flex items-center gap-5 mb-5 sm:mb-7">
            <div className="w-10 h-px bg-[#c4952a]/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a]/50" />
            <div className="flex-1 h-px bg-[#c4952a]/15" />
          </div>

          <p className="hidden sm:block text-white/30 text-[13px] leading-[1.8] max-w-[260px]">
            A curated evening of exceptional properties and exclusive real estate insights.
          </p>

          <div className="mt-6 sm:mt-12 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a] animate-pulse-gold" />
            <span className="text-white/20 text-[11px] tracking-[0.2em]">
              QR pass delivered to your inbox
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 bg-[#F7F3EC] flex flex-col">
        <div className="flex-1 flex items-start sm:items-center justify-center px-5 py-8 sm:px-8 sm:py-12 lg:px-14 xl:px-20">
          <div className="w-full max-w-[420px] animate-fade-in-up">

            {/* Form header */}
            <div className="mb-7 sm:mb-11">
              <div className="flex items-center gap-2 mb-5 sm:mb-7">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a] animate-pulse-gold" />
                <span className="text-[#c4952a] text-[9px] tracking-[0.5em] uppercase font-bold">
                  Registration Open
                </span>
              </div>
              <h2
                className="font-display text-[#080808] leading-[1.05]"
                style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)" }}
              >
                Complete<br />Your Details
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">

              {/* Name row — stacked on mobile, side by side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className="block text-[9px] font-bold text-[#9A8F7E] tracking-[0.28em] uppercase mb-2">
                    First Name <span className="text-[#c4952a]">*</span>
                  </label>
                  <input
                    type="text" name="firstName" required
                    value={form.firstName} onChange={handleChange}
                    placeholder="John"
                    className="input-line"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#9A8F7E] tracking-[0.28em] uppercase mb-2">
                    Last Name <span className="text-[#c4952a]">*</span>
                  </label>
                  <input
                    type="text" name="lastName" required
                    value={form.lastName} onChange={handleChange}
                    placeholder="Doe"
                    className="input-line"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[9px] font-bold text-[#9A8F7E] tracking-[0.28em] uppercase mb-2">
                  Email Address <span className="text-[#c4952a]">*</span>
                </label>
                <input
                  type="email" name="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="john@company.com"
                  className="input-line"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[9px] font-bold text-[#9A8F7E] tracking-[0.28em] uppercase mb-2">
                  Mobile Number <span className="text-[#c4952a]">*</span>
                </label>
                <PhoneInput
                  value={form.phone}
                  onChange={handlePhoneChange}
                  variant="light"
                  defaultCountry="IN"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-[9px] font-bold text-[#9A8F7E] tracking-[0.28em] uppercase mb-2">
                  Company / Organization
                </label>
                <input
                  type="text" name="company"
                  value={form.company} onChange={handleChange}
                  placeholder="Your company"
                  className="input-line"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[9px] font-bold text-[#9A8F7E] tracking-[0.28em] uppercase mb-2">
                  Designation / Role
                </label>
                <input
                  type="text" name="designation"
                  value={form.designation} onChange={handleChange}
                  placeholder="Your position"
                  className="input-line"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 py-3 border-l-2 border-red-400 pl-4 animate-fade-in">
                  <p className="text-red-500 text-sm leading-snug">{error}</p>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2 sm:pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full bg-[#080808] text-white text-[11px] font-semibold tracking-[0.15em] uppercase py-4 sm:py-5 flex items-center justify-center gap-4 hover:bg-[#c4952a] transition-colors duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
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
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-[#B4A992] text-[10px] mt-4 tracking-[0.15em]">
                  By registering you agree to receive event communications
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 px-5 sm:px-10 flex items-center justify-center border-t border-[#E8DFD0]">
          <span className="text-[#C4B49A] text-[9px] tracking-[0.35em] uppercase">© Exclusive Event 2025</span>
        </div>
      </div>
    </div>
  );
}
