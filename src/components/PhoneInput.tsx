"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Country definitions ──────────────────────────────────────────────────────
interface Country {
  code: string;
  flag: string;
  name: string;
  dial: string;
  digits: number;
  validate: (n: string) => boolean;
  placeholder: string;
  hint: string;
}

const COUNTRIES: Country[] = [
  {
    code: "IN", flag: "🇮🇳", name: "India", dial: "+91",
    digits: 10,
    validate: (n) => /^[6-9]\d{9}$/.test(n),
    placeholder: "98765 43210",
    hint: "10 digits, starts with 6–9",
  },
  {
    code: "AE", flag: "🇦🇪", name: "UAE", dial: "+971",
    digits: 9,
    validate: (n) => /^5[024568]\d{7}$/.test(n) || /^[234679]\d{7}$/.test(n),
    placeholder: "50 123 4567",
    hint: "9 digits (e.g. 501234567)",
  },
  {
    code: "SA", flag: "🇸🇦", name: "Saudi Arabia", dial: "+966",
    digits: 9,
    validate: (n) => /^5\d{8}$/.test(n) || /^[1234679]\d{7}$/.test(n),
    placeholder: "51 234 5678",
    hint: "9 digits",
  },
  {
    code: "US", flag: "🇺🇸", name: "USA / Canada", dial: "+1",
    digits: 10,
    validate: (n) => /^[2-9]\d{2}[2-9]\d{6}$/.test(n),
    placeholder: "212 555 0100",
    hint: "10 digits (area code + number)",
  },
  {
    code: "GB", flag: "🇬🇧", name: "United Kingdom", dial: "+44",
    digits: 10,
    validate: (n) => /^[7]\d{9}$/.test(n) || /^\d{10}$/.test(n),
    placeholder: "7911 123456",
    hint: "10 digits (mobile starts with 7)",
  },
  {
    code: "PK", flag: "🇵🇰", name: "Pakistan", dial: "+92",
    digits: 10,
    validate: (n) => /^3\d{9}$/.test(n),
    placeholder: "301 2345678",
    hint: "10 digits, starts with 3",
  },
  {
    code: "BD", flag: "🇧🇩", name: "Bangladesh", dial: "+880",
    digits: 10,
    validate: (n) => /^1[3-9]\d{8}$/.test(n),
    placeholder: "1712 345678",
    hint: "10 digits, starts with 1",
  },
  {
    code: "QA", flag: "🇶🇦", name: "Qatar", dial: "+974",
    digits: 8,
    validate: (n) => /^[3-7]\d{7}$/.test(n),
    placeholder: "3312 3456",
    hint: "8 digits",
  },
  {
    code: "KW", flag: "🇰🇼", name: "Kuwait", dial: "+965",
    digits: 8,
    validate: (n) => /^[569]\d{7}$/.test(n),
    placeholder: "5012 3456",
    hint: "8 digits",
  },
  {
    code: "BH", flag: "🇧🇭", name: "Bahrain", dial: "+973",
    digits: 8,
    validate: (n) => /^[369]\d{7}$/.test(n),
    placeholder: "3600 0000",
    hint: "8 digits",
  },
  {
    code: "OM", flag: "🇴🇲", name: "Oman", dial: "+968",
    digits: 8,
    validate: (n) => /^[79]\d{7}$/.test(n),
    placeholder: "9212 3456",
    hint: "8 digits",
  },
  {
    code: "LK", flag: "🇱🇰", name: "Sri Lanka", dial: "+94",
    digits: 9,
    validate: (n) => /^7\d{8}$/.test(n),
    placeholder: "71 234 5678",
    hint: "9 digits, starts with 7",
  },
  {
    code: "AU", flag: "🇦🇺", name: "Australia", dial: "+61",
    digits: 9,
    validate: (n) => /^4\d{8}$/.test(n) || /^[23578]\d{8}$/.test(n),
    placeholder: "412 345 678",
    hint: "9 digits",
  },
  {
    code: "SG", flag: "🇸🇬", name: "Singapore", dial: "+65",
    digits: 8,
    validate: (n) => /^[689]\d{7}$/.test(n),
    placeholder: "8123 4567",
    hint: "8 digits",
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────────
interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string, isValid: boolean) => void;
  variant?: "light" | "dark";
  defaultCountry?: string; // country code e.g. "IN"
  error?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function PhoneInput({
  value,
  onChange,
  variant = "light",
  defaultCountry = "IN",
  error,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0]
  );
  const [local, setLocal] = useState("");
  const [touched, setTouched] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value → local if parent resets to ""
  useEffect(() => {
    if (value === "") setLocal("");
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const handleLocalChange = useCallback(
    (raw: string) => {
      // Only digits
      const digits = raw.replace(/\D/g, "");
      // Cap at max digits
      const capped = digits.slice(0, country.digits);
      setLocal(capped);
      setTouched(true);
      const full = country.dial + capped;
      const valid = country.validate(capped);
      onChange(full, valid);
    },
    [country, onChange]
  );

  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    setLocal("");
    onChange(c.dial, false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isValid = country.validate(local);
  const showError = touched && local.length > 0 && !isValid;
  const showSuccess = touched && isValid;

  // ── Shared class helpers ──
  const isDark = variant === "dark";

  const triggerCls = isDark
    ? "flex items-center gap-2 px-3 bg-white/[0.04] border border-white/10 rounded-l-lg h-full text-white/80 hover:bg-white/[0.07] hover:border-white/20 transition-all text-sm font-medium min-w-[88px] justify-between focus:outline-none focus:border-[#c4952a]/50"
    : "flex items-center gap-2 px-3 bg-[#fdf8f2] border border-[#e0d8ca] rounded-l-lg h-full text-[#3d3529] hover:bg-[#f5efe4] hover:border-[#ccc2b0] transition-all text-sm font-medium min-w-[88px] justify-between focus:outline-none focus:border-[#c4952a]";

  const inputCls = isDark
    ? `flex-1 bg-white/[0.04] border border-l-0 border-white/10 rounded-r-lg px-4 py-3.5 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#c4952a]/50 focus:ring-0 transition-all ${showError ? "border-red-500/60" : showSuccess ? "border-green-500/50" : ""}`
    : `flex-1 bg-white border border-l-0 border-[#e0d8ca] rounded-r-lg px-4 py-3.5 text-[#0d0d0d] placeholder:text-[#b8b0a0] text-sm focus:outline-none focus:border-[#c4952a] focus:ring-1 focus:ring-[#c4952a]/25 transition-all ${showError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : showSuccess ? "border-green-400 focus:border-green-400 focus:ring-green-400/20" : ""}`;

  const dropdownBg = isDark
    ? "bg-[#1a1a1a] border border-white/10 shadow-2xl shadow-black/60"
    : "bg-white border border-[#e8e2d5] shadow-2xl shadow-black/10";

  const dropdownSearchCls = isDark
    ? "w-full px-3 py-2 bg-white/[0.05] border-b border-white/[0.08] text-white placeholder:text-white/30 text-sm focus:outline-none"
    : "w-full px-3 py-2 bg-[#faf7f2] border-b border-[#e8e2d5] text-[#0d0d0d] placeholder:text-[#b8b0a0] text-sm focus:outline-none";

  const itemCls = (active: boolean) =>
    isDark
      ? `flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${active ? "bg-[#c4952a]/15 text-[#c4952a]" : "text-white/75 hover:bg-white/[0.06]"}`
      : `flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${active ? "bg-[#fdf3e0] text-[#c4952a]" : "text-[#2a2219] hover:bg-[#faf7f2]"}`;

  return (
    <div className="w-full">
      <div className="flex h-[46px]" ref={dropdownRef}>
        {/* ── Country trigger ── */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className={triggerCls}
          aria-label="Select country code"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className={isDark ? "text-white/50 text-xs" : "text-[#8a7f6e] text-xs"}>
            {country.dial}
          </span>
          <svg
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""} ${isDark ? "text-white/30" : "text-[#b8b0a0]"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* ── Number input ── */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={local}
            onChange={(e) => handleLocalChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={country.placeholder}
            className={inputCls}
          />
          {/* Valid / Invalid indicator */}
          {touched && local.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* ── Dropdown ── */}
        {open && (
          <div
            className={`absolute z-50 mt-[46px] rounded-xl overflow-hidden ${dropdownBg}`}
            style={{ width: "280px" }}
          >
            {/* Search */}
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className={dropdownSearchCls}
            />
            {/* List */}
            <ul className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className={`px-4 py-3 text-sm ${isDark ? "text-white/30" : "text-[#b8b0a0]"}`}>
                  No results
                </li>
              ) : (
                filtered.map((c) => (
                  <li
                    key={c.code}
                    onClick={() => handleCountrySelect(c)}
                    className={itemCls(c.code === country.code)}
                  >
                    <span className="text-lg leading-none w-6 text-center">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className={`text-xs tabular-nums ${isDark ? "text-white/30" : "text-[#b8b0a0]"}`}>
                      {c.dial}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* ── Hint / Error ── */}
      <div className="mt-1.5 min-h-[18px]">
        {(showError || error) ? (
          <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-red-400" : "text-red-500"}`}>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error || `Please enter a valid ${country.name} number (${country.hint})`}
          </p>
        ) : showSuccess ? (
          <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-green-400" : "text-green-600"}`}>
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Looks good
          </p>
        ) : local.length > 0 ? (
          <p className={`text-xs ${isDark ? "text-white/20" : "text-[#b8b0a0]"}`}>
            {country.digits - local.length} more digit{country.digits - local.length !== 1 ? "s" : ""} needed
          </p>
        ) : (
          <p className={`text-xs ${isDark ? "text-white/20" : "text-[#b8b0a0]"}`}>
            {country.hint}
          </p>
        )}
      </div>
    </div>
  );
}
