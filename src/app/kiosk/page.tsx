"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Stage = "search" | "confirming" | "success" | "already_in" | "not_found";

interface AttendeeResult {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  designation: string | null;
  checkedIn: boolean;
}

export default function KioskPage() {
  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AttendeeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AttendeeResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);

  // Not-on-list form
  const [guestForm, setGuestForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on search stage
  useEffect(() => {
    if (stage === "search") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [stage]);

  // Auto-reset after success / already_in
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
        const res = await fetch(
          `/api/search-attendees?q=${encodeURIComponent(value.trim())}`
        );
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
    <div className="min-h-screen bg-charcoal-900 flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-gold-400 rounded-full"></div>
          <h1 className="font-display text-gold-400 text-xl tracking-[0.2em] uppercase">
            Exclusive Event
          </h1>
        </div>
        <span className="text-charcoal-400 text-sm tracking-wider uppercase">
          Guest Check-In
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {/* ── SEARCH STAGE ── */}
        {stage === "search" && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="font-display text-4xl md:text-5xl text-white mb-3">
                Welcome
              </h2>
              <p className="text-charcoal-400 text-lg">
                Search your name to check in
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                {searching ? (
                  <svg
                    className="animate-spin w-5 h-5 text-gold-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-charcoal-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type your first or last name..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-charcoal-500 rounded-2xl pl-14 pr-5 py-5 text-xl focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="absolute inset-y-0 right-5 flex items-center text-charcoal-500 hover:text-white transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-3 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {results.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => handleSelect(a)}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gold-50 transition-colors ${
                      i < results.length - 1
                        ? "border-b border-charcoal-100"
                        : ""
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-charcoal-900 text-lg">
                        {a.firstName} {a.lastName}
                      </p>
                      {a.company && (
                        <p className="text-charcoal-500 text-sm">{a.company}</p>
                      )}
                    </div>
                    {a.checkedIn ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Checked In
                      </span>
                    ) : (
                      <svg
                        className="w-5 h-5 text-charcoal-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="mt-3 text-center text-charcoal-500 text-sm py-4">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Not on list CTA */}
            <div className="mt-8 text-center">
              <p className="text-charcoal-500 text-sm mb-3">
                Can&apos;t find your name?
              </p>
              <button
                onClick={() => setStage("not_found")}
                className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-medium border border-gold-400/30 hover:border-gold-400/60 px-5 py-2.5 rounded-xl transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                My name is not on the list
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRMING STAGE ── */}
        {stage === "confirming" && selected && (
          <div className="w-full max-w-md text-center animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-charcoal-900 px-8 pt-10 pb-8">
                <div className="w-20 h-20 bg-gold-400/10 border-2 border-gold-400/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="font-display text-gold-400 text-3xl">
                    {selected.firstName[0]}
                    {selected.lastName[0]}
                  </span>
                </div>
                <h2 className="font-display text-3xl text-white mb-1">
                  {selected.firstName} {selected.lastName}
                </h2>
                {selected.company && (
                  <p className="text-charcoal-400 text-sm">{selected.company}</p>
                )}
                {selected.designation && (
                  <p className="text-charcoal-500 text-xs mt-1">
                    {selected.designation}
                  </p>
                )}
              </div>

              <div className="px-8 py-8 space-y-3">
                <p className="text-charcoal-600 text-base mb-6">
                  Is this you? Tap confirm to check in.
                </p>

                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-4"
                >
                  {confirming ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Checking in...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Yes, Check Me In
                    </>
                  )}
                </button>

                <button
                  onClick={resetToSearch}
                  className="w-full text-charcoal-500 hover:text-charcoal-700 text-sm py-3 transition-colors"
                >
                  Not me — search again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUCCESS STAGE ── */}
        {stage === "success" && selected && (
          <div className="w-full max-w-md text-center animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl px-8 py-12">
              {/* Checkmark */}
              <div className="w-24 h-24 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="font-display text-4xl text-charcoal-900 mb-2">
                Welcome!
              </h2>
              <p className="text-2xl text-charcoal-700 font-medium mb-1">
                {selected.firstName} {selected.lastName}
              </p>
              {selected.company && (
                <p className="text-charcoal-500 text-sm mb-6">
                  {selected.company}
                </p>
              )}

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-green-700 text-sm font-medium">
                  Successfully Checked In
                </span>
              </div>

              <p className="text-charcoal-400 text-xs mt-8">
                Returning to home screen in a moment...
              </p>
            </div>
          </div>
        )}

        {/* ── ALREADY CHECKED IN STAGE ── */}
        {stage === "already_in" && selected && (
          <div className="w-full max-w-md text-center animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl px-8 py-12">
              <div className="w-24 h-24 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>

              <h2 className="font-display text-3xl text-charcoal-900 mb-2">
                Already Checked In
              </h2>
              <p className="text-xl text-charcoal-700 font-medium mb-2">
                {selected.firstName} {selected.lastName}
              </p>
              {checkedInAt && (
                <p className="text-charcoal-500 text-sm mb-6">
                  Checked in at{" "}
                  {new Date(checkedInAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full mb-6">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-amber-700 text-sm font-medium">
                  Duplicate Entry
                </span>
              </div>

              <p className="text-charcoal-400 text-xs mt-4">
                Returning to home screen in a moment...
              </p>
            </div>
          </div>
        )}

        {/* ── NOT FOUND / GUEST FORM STAGE ── */}
        {stage === "not_found" && (
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-charcoal-900 px-8 py-7 text-center">
                <h2 className="font-display text-2xl text-white mb-1">
                  Register as Guest
                </h2>
                <p className="text-charcoal-400 text-sm">
                  Enter your details to check in
                </p>
              </div>

              <form onSubmit={handleGuestSubmit} className="px-8 py-8 space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={guestForm.firstName}
                      onChange={(e) =>
                        setGuestForm((p) => ({
                          ...p,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder="John"
                      className="input-luxury !py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={guestForm.lastName}
                      onChange={(e) =>
                        setGuestForm((p) => ({
                          ...p,
                          lastName: e.target.value,
                        }))
                      }
                      placeholder="Doe"
                      className="input-luxury !py-3"
                    />
                  </div>
                </div>

                {/* Email — required */}
                <div>
                  <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={guestForm.email}
                    onChange={(e) =>
                      setGuestForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="john@example.com"
                    className="input-luxury !py-3"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-charcoal-600 tracking-wider uppercase mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) =>
                      setGuestForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+971 50 000 0000"
                    className="input-luxury !py-3"
                  />
                </div>

                {guestError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{guestError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={guestLoading}
                  className="btn-gold w-full flex items-center justify-center gap-2 py-4 text-base mt-2"
                >
                  {guestLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Checking In...
                    </>
                  ) : (
                    "Check In as Guest"
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetToSearch}
                  className="w-full text-charcoal-500 hover:text-charcoal-700 text-sm py-2 transition-colors"
                >
                  ← Back to search
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-white/5">
        <p className="text-charcoal-600 text-xs tracking-wider">
          Need help? Please approach a staff member.
        </p>
      </footer>
    </div>
  );
}
