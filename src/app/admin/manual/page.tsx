"use client";

import { useState } from "react";

interface ManualResult {
  type: "success" | "info" | "error";
  message: string;
}

export default function ManualEntryPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManualResult | null>(null);
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
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/manual-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error || "Entry failed." });
      } else if (data.alreadyExists) {
        setResult({ type: "info", message: data.message });
      } else {
        setResult({ type: "success", message: data.message });
      }

      // Clear form on success
      if (res.ok) {
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          designation: "",
        });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl text-charcoal-900 mb-2">Manual Entry</h2>
        <p className="text-charcoal-500 text-sm">
          For walk-in visitors or when QR code is unreadable
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Result Banner */}
        {result && (
          <div
            className={`p-4 flex items-center gap-3 ${
              result.type === "success"
                ? "bg-green-50 border-b border-green-200"
                : result.type === "info"
                ? "bg-blue-50 border-b border-blue-200"
                : "bg-red-50 border-b border-red-200"
            }`}
          >
            {result.type === "success" ? (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : result.type === "info" ? (
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p
              className={`text-sm font-medium ${
                result.type === "success"
                  ? "text-green-700"
                  : result.type === "info"
                  ? "text-blue-700"
                  : "text-red-700"
              }`}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                className="input-luxury !py-3"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="input-luxury !py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="input-luxury !py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="input-luxury !py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Optional"
              className="input-luxury !py-3"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
              Designation
            </label>
            <input
              type="text"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              placeholder="Optional"
              className="input-luxury !py-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2 mt-2"
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
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Register & Check In
              </>
            )}
          </button>
        </form>
      </div>

      <div className="p-4 bg-white rounded-xl shadow-sm border-l-3 border-l-gold-400">
        <p className="text-charcoal-600 text-sm">
          <strong>Note:</strong> Manual entries are automatically checked in.
          If the email already exists, the existing visitor will be checked in.
        </p>
      </div>
    </div>
  );
}
