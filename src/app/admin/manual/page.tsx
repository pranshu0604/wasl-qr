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

      if (res.ok) {
        setForm({ firstName: "", lastName: "", email: "", phone: "", company: "", designation: "" });
      }
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const resultStyles = {
    success: { wrap: "bg-green-50 border-green-200", icon: "text-green-600", text: "text-green-700" },
    info:    { wrap: "bg-blue-50 border-blue-200",   icon: "text-blue-600",   text: "text-blue-700"   },
    error:   { wrap: "bg-red-50 border-red-200",     icon: "text-red-600",    text: "text-red-700"    },
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="font-display text-[#0a0a0a] text-2xl mb-1">Manual Entry</h2>
        <p className="text-[#8a7f6e] text-sm">For walk-in visitors or when QR code is unreadable</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e2d5] overflow-hidden">
        {result && (
          <div className={`px-6 py-4 border-b flex items-start gap-3 animate-fade-in ${resultStyles[result.type].wrap}`}>
            {result.type === "success" ? (
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : result.type === "info" ? (
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            ) : (
              <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <p className={`text-sm font-medium ${resultStyles[result.type].text}`}>{result.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                First Name <span className="text-[#c4952a]">*</span>
              </label>
              <input type="text" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="First name" className="input-luxury" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
                Last Name <span className="text-[#c4952a]">*</span>
              </label>
              <input type="text" name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Last name" className="input-luxury" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
              Email Address <span className="text-[#c4952a]">*</span>
            </label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="email@example.com" className="input-luxury" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">
              Mobile Number <span className="text-[#8a7f6e] text-[9px] normal-case tracking-normal">(optional)</span>
            </label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+971 50 123 4567" className="input-luxury" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">Company</label>
            <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="Optional" className="input-luxury" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6b6359] tracking-[0.18em] uppercase mb-2">Designation</label>
            <input type="text" name="designation" value={form.designation} onChange={handleChange} placeholder="Optional" className="input-luxury" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c4952a] text-white text-sm font-medium py-4 rounded-lg hover:bg-[#d4a844] transition-colors flex items-center justify-center gap-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Register &amp; Check In
              </>
            )}
          </button>
        </form>
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5 bg-[#fdf3e0] border border-[#c4952a]/20 rounded-xl">
        <svg className="w-4 h-4 text-[#c4952a] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-[#6b4c1a] text-sm">
          Manual entries are automatically checked in. If the email already exists, the existing visitor will be checked in.
        </p>
      </div>
    </div>
  );
}
