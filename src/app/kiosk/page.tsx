"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import PhoneInput from "@/components/PhoneInput";

type Stage = "search" | "confirming" | "success" | "already_in" | "not_found";

interface AttendeeResult {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  designation: string | null;
  checkedIn: boolean;
}

function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function KioskPage() {
  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AttendeeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AttendeeResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);

  const [guestForm, setGuestForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [guestPhoneValid, setGuestPhoneValid] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stage === "search") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === "success" || stage === "already_in") {
      const timer = setTimeout(resetToSearch, 5000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const resetToSearch = () => {
    setStage("search");
    setQuery("");
    setResults([]);
    setSelected(null);
    setCheckedInAt(null);
    setGuestForm({ firstName: "", lastName: "", email: "", phone: "" });
    setGuestPhoneValid(false);
    setGuestError("");
  };

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-attendees?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.attendees || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSelect = (attendee: AttendeeResult) => {
    setSelected(attendee);
    setStage("confirming");
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/self-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId: selected.id }),
      });
      const data = await res.json();
      if (data.alreadyCheckedIn) {
        setCheckedInAt(data.attendee?.checkedInAt || null);
        setStage("already_in");
      } else {
        setStage("success");
      }
    } catch {
      setStage("search");
    } finally {
      setConfirming(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true);
    setGuestError("");
    try {
      const res = await fetch("/api/manual-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: guestForm.firstName.trim() || "Guest",
          lastName: guestForm.lastName.trim() || "-",
          email: guestForm.email.trim(),
          phone: guestForm.phone.trim() || "N/A",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGuestError(data.error || "Something went wrong.");
      } else {
        setSelected({
          id: data.id,
          firstName: guestForm.firstName || "Guest",
          lastName: guestForm.lastName || "",
          company: null,
          designation: null,
          checkedIn: false,
        });
        setStage("success");
      }
    } catch {
      setGuestError("Something went wrong. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-dot-grid flex flex-col">

      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-white/[0.06] py-5 px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-px bg-[#c4952a]" />
            <span className="font-display text-[#c4952a] text-lg tracking-[0.25em] uppercase">
              Exclusive Event
            </span>
          </div>
          <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-medium">
            Guest Check-In
          </span>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">

        {/* ── SEARCH ── */}
        {stage === "search" && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            <div className="text-center mb-12">
              <h2 className="font-display text-white text-[4.5rem] md:text-[5.5rem] leading-none mb-4">
                Welcome
              </h2>
              <p className="text-white/30 text-lg tracking-wide">
                Search your name to check in for today&apos;s event
              </p>
            </div>

            {/* Search input */}
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                {searching ? (
                  <Spinner className="w-5 h-5 text-[#c4952a]" />
                ) : (
                  <svg className="w-5 h-5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type your first or last name..."
                className="w-full bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-14 pr-14 py-5 text-xl focus:outline-none focus:border-[#c4952a]/40 focus:ring-1 focus:ring-[#c4952a]/15 transition-all"
              />

              {query && (
                <button
                  onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Results dropdown */}
            {results.length > 0 && (
              <div className="mt-2 bg-white rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-slide-down">
                {results.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#fdf8f0] transition-colors group ${
                      i < results.length - 1 ? "border-b border-[#f0e8d8]" : ""
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-[#0a0a0a] text-lg leading-tight">
                        {a.firstName} {a.lastName}
                      </p>
                      {a.company && (
                        <p className="text-[#8a7f6e] text-sm mt-0.5">{a.company}</p>
                      )}
                    </div>
                    {a.checkedIn ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full flex-shrink-0 ml-4">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Checked In
                      </span>
                    ) : (
                      <svg className="w-5 h-5 text-[#c4952a]/60 group-hover:text-[#c4952a] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="mt-3 text-center text-white/25 text-sm py-3 animate-fade-in">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Not on list CTA */}
            <div className="mt-10 text-center">
              <p className="text-white/20 text-sm mb-3">Name not showing up?</p>
              <button
                onClick={() => setStage("not_found")}
                className="inline-flex items-center gap-2 text-[#c4952a]/60 hover:text-[#c4952a] text-sm font-medium border border-[#c4952a]/15 hover:border-[#c4952a]/35 px-5 py-2.5 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                My name is not on the list
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRMING ── */}
        {stage === "confirming" && selected && (
          <div className="w-full max-w-sm text-center animate-scale-in">
            {/* Avatar */}
            <div className="relative mx-auto w-fit mb-7">
              <div className="w-24 h-24 rounded-full border-2 border-[#c4952a]/30 bg-[#c4952a]/[0.07] flex items-center justify-center">
                <span className="font-display text-[#c4952a] text-3xl">
                  {selected.firstName[0]}{selected.lastName[0]}
                </span>
              </div>
            </div>

            <h2 className="font-display text-white text-4xl mb-1.5">
              {selected.firstName} {selected.lastName}
            </h2>
            {selected.company && (
              <p className="text-white/35 text-sm mb-1">{selected.company}</p>
            )}
            {selected.designation && (
              <p className="text-white/20 text-xs">{selected.designation}</p>
            )}

            <div className="flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-white/25 text-[10px] tracking-[0.3em] uppercase">Confirm Identity</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full bg-[#c4952a] text-white text-base font-medium py-4 rounded-xl hover:bg-[#d4a844] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {confirming ? (
                  <><Spinner className="w-5 h-5" /> Checking In...</>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Yes, Check Me In
                  </>
                )}
              </button>

              <button
                onClick={resetToSearch}
                className="w-full text-white/25 hover:text-white/50 text-sm py-3 transition-colors"
              >
                ← Not me, search again
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {stage === "success" && selected && (
          <div className="w-full max-w-md text-center animate-scale-in">
            {/* Glow */}
            <div className="relative mx-auto w-fit mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 bg-green-500/10 rounded-full blur-2xl" />
              </div>
              <div className="relative w-24 h-24 rounded-full border-2 border-green-500/40 bg-green-500/[0.08] flex items-center justify-center">
                <svg className="w-11 h-11 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>

            <h2 className="font-display text-white text-6xl md:text-7xl mb-3">
              Welcome!
            </h2>
            <p className="text-white/65 text-2xl font-light mb-1">
              {selected.firstName} {selected.lastName}
            </p>
            {selected.company && (
              <p className="text-white/30 text-sm mb-7">{selected.company}</p>
            )}
            {!selected.company && <div className="mb-7" />}

            <div className="inline-flex items-center gap-2.5 bg-green-500/[0.08] border border-green-500/25 text-green-400 text-sm font-medium px-5 py-2.5 rounded-full mb-10">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              Successfully Checked In
            </div>

            {/* Countdown bar */}
            <div>
              <div className="h-0.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div className="h-full bg-white/20 rounded-full animate-countdown" />
              </div>
              <p className="text-white/15 text-xs mt-2.5 tracking-wider">
                Returning to home screen...
              </p>
            </div>
          </div>
        )}

        {/* ── ALREADY IN ── */}
        {stage === "already_in" && selected && (
          <div className="w-full max-w-md text-center animate-scale-in">
            <div className="relative mx-auto w-fit mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 bg-amber-500/8 rounded-full blur-2xl" />
              </div>
              <div className="relative w-24 h-24 rounded-full border-2 border-amber-500/35 bg-amber-500/[0.06] flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>

            <h2 className="font-display text-white text-4xl mb-2">
              Already Checked In
            </h2>
            <p className="text-white/55 text-xl font-light mb-1">
              {selected.firstName} {selected.lastName}
            </p>
            {checkedInAt && (
              <p className="text-white/25 text-sm mb-7">
                Checked in at{" "}
                {new Date(checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {!checkedInAt && <div className="mb-7" />}

            <div className="inline-flex items-center gap-2.5 bg-amber-500/[0.07] border border-amber-500/25 text-amber-400 text-sm font-medium px-5 py-2.5 rounded-full mb-10">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              Duplicate Entry
            </div>

            <div>
              <div className="h-0.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div className="h-full bg-white/15 rounded-full animate-countdown" />
              </div>
              <p className="text-white/15 text-xs mt-2.5 tracking-wider">
                Returning to home screen...
              </p>
            </div>
          </div>
        )}

        {/* ── NOT FOUND / GUEST ── */}
        {stage === "not_found" && (
          <div className="w-full max-w-md animate-scale-in">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden">
              {/* Header */}
              <div className="px-8 py-7 border-b border-white/[0.07] text-center">
                <h2 className="font-display text-white text-2xl mb-1">
                  Register as Guest
                </h2>
                <p className="text-white/30 text-sm">Enter your details to check in</p>
              </div>

              {/* Form */}
              <form onSubmit={handleGuestSubmit} className="px-8 py-7 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 tracking-[0.15em] uppercase mb-2">First Name</label>
                    <input
                      type="text"
                      value={guestForm.firstName}
                      onChange={(e) => setGuestForm(p => ({ ...p, firstName: e.target.value }))}
                      placeholder="John"
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-white/30 tracking-[0.15em] uppercase mb-2">Last Name</label>
                    <input
                      type="text"
                      value={guestForm.lastName}
                      onChange={(e) => setGuestForm(p => ({ ...p, lastName: e.target.value }))}
                      placeholder="Doe"
                      className="input-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/30 tracking-[0.15em] uppercase mb-2">
                    Email Address <span className="text-[#c4952a]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestForm.email}
                    onChange={(e) => setGuestForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="john@company.com"
                    className="input-dark"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/30 tracking-[0.15em] uppercase mb-2">Mobile Number</label>
                  <PhoneInput
                    value={guestForm.phone}
                    onChange={(full, valid) => {
                      setGuestForm(p => ({ ...p, phone: full }));
                      setGuestPhoneValid(valid);
                    }}
                    variant="dark"
                    defaultCountry="IN"
                  />
                </div>

                {guestError && (
                  <p className="text-red-400 text-sm animate-fade-in">{guestError}</p>
                )}

                <button
                  type="submit"
                  disabled={guestLoading}
                  className="w-full bg-[#c4952a] text-white font-medium py-4 rounded-xl hover:bg-[#d4a844] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 mt-2"
                >
                  {guestLoading ? (
                    <><Spinner className="w-5 h-5" /> Checking In...</>
                  ) : (
                    "Check In as Guest"
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetToSearch}
                  className="w-full text-white/20 hover:text-white/40 text-sm py-2 transition-colors"
                >
                  ← Back to search
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 py-4 px-8 border-t border-white/[0.05] text-center">
        <p className="text-white/15 text-xs tracking-widest uppercase">
          Need assistance? Please approach a staff member.
        </p>
      </footer>
    </div>
  );
}
