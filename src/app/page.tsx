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

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push(`/success?id=${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Header */}
      <header className="bg-charcoal-900 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <h1 className="font-display text-gold-400 text-2xl md:text-3xl tracking-[0.2em] uppercase">
            Exclusive Event
          </h1>
          <Link
            href="/admin"
            className="text-charcoal-400 hover:text-white text-sm transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-charcoal-900/5 overflow-hidden">
            {/* Card Header */}
            <div className="px-8 pt-10 pb-6 text-center border-b border-charcoal-100">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-50 border border-gold-200 rounded-full mb-4">
                <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                <span className="text-xs font-medium text-gold-700 tracking-wider uppercase">
                  Registration Open
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-charcoal-900 mb-2">
                Reserve Your Spot
              </h2>
              <p className="text-charcoal-500 text-sm">
                Complete the form below to receive your exclusive digital pass
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                    First Name <span className="text-red-500">*</span>
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
                  <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                    Last Name <span className="text-red-500">*</span>
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

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="input-luxury"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="input-luxury"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                  Company / Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="input-luxury"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="input-luxury"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Register & Get QR Pass"
                )}
              </button>

              <p className="text-center text-charcoal-400 text-xs mt-4">
                Your QR pass will be sent to your email address
              </p>
            </form>
          </div>

          {/* Footer Note */}
          <p className="text-center text-charcoal-400 text-xs mt-8">
            By registering, you agree to receive event communications via email.
          </p>
        </div>
      </main>
    </div>
  );
}
