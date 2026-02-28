"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Stage = "search" | "confirming" | "registered" | "not_found";

interface AttendeeResult {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
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
  const [guestForm, setGuestForm] = useState({ firstName: "", lastName: "", email: "" });
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (stage === "search") setTimeout(() => inputRef.current?.focus(), 100);
  }, [stage]);

  useEffect(() => {
    if (stage === "registered") {
      const t = setTimeout(resetToSearch, 8000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const resetToSearch = () => {
    setStage("search"); setQuery(""); setResults([]); setSelected(null);
    setGuestForm({ firstName: "", lastName: "", email: "" });
    setGuestError("");
  };

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-attendees?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.attendees || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  // No API call — official check-in only happens when staff scans QR at the door
  const handleConfirm = () => setStage("registered");

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true); setGuestError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: guestForm.firstName.trim(),
          lastName:  guestForm.lastName.trim(),
          email:     guestForm.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 409) { setGuestError(data.error || "Registration failed."); return; }
      setSelected({ id: data.id || "", firstName: guestForm.firstName.trim(), lastName: guestForm.lastName.trim(), company: null, checkedIn: false });
      setStage("registered");
    } catch { setGuestError("Something went wrong. Please try again."); }
    finally { setGuestLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: "repeating-linear-gradient(45deg, #c4952a 0, #c4952a 1px, transparent 0, transparent 50%)", backgroundSize: "48px 48px" }} />

      <header className="relative z-10 border-b border-white/[0.05] py-5 px-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-[#c4952a]" />
            <span className="font-display text-[#c4952a] text-base tracking-[0.3em] uppercase">Exclusive Event</span>
          </div>
          <span className="text-white/15 text-[9px] tracking-[0.4em] uppercase font-medium">Guest Check-In</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-8 py-10">

        {/* SEARCH */}
        {stage === "search" && (
          <div className="w-full max-w-3xl animate-fade-in-up">
            <div className="text-center mb-14">
              <h2 className="font-display text-white font-light leading-none tracking-tight mb-5" style={{ fontSize: "clamp(6rem, 16vw, 13rem)" }}>Welcome</h2>
              <p className="text-white/25 text-base tracking-[0.15em]">Search your name to check in for today&apos;s event</p>
            </div>

            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                {searching ? <Spinner className="w-5 h-5 text-[#c4952a]" /> : <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
              </div>
              <input ref={inputRef} type="text" value={query} onChange={(e) => handleSearch(e.target.value)} placeholder="Type your first or last name..." className="w-full bg-white/[0.03] border-b border-white/15 text-white placeholder:text-white/15 rounded-none pl-16 pr-14 py-5 text-2xl focus:outline-none focus:border-[#c4952a]/50 transition-colors duration-300" />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Results — first name + last initial only for privacy */}
            {results.length > 0 && (
              <div className="mt-0 bg-[#F7F3EC] overflow-hidden animate-slide-down shadow-2xl shadow-black/60">
                {results.map((a, i) => (
                  <button key={a.id} onClick={() => { setSelected(a); setStage("confirming"); }}
                    className={`w-full flex items-center justify-between px-8 py-5 text-left hover:bg-[#EDE5D5] transition-colors group ${i < results.length - 1 ? "border-b border-[#E0D5C0]" : ""}`}>
                    <div>
                      <p className="font-semibold text-[#080808] text-xl leading-tight">{a.firstName} {a.lastName[0]}.</p>
                      {a.company && <p className="text-[#9A8F7E] text-sm mt-0.5">{a.company}</p>}
                    </div>
                    {a.checkedIn
                      ? <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 flex-shrink-0 ml-4"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Checked In</span>
                      : <svg className="w-5 h-5 text-[#c4952a]/40 group-hover:text-[#c4952a] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                    }
                  </button>
                ))}
              </div>
            )}

            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <div className="mt-4 text-center text-white/20 text-sm py-3 tracking-wider animate-fade-in">No results for &ldquo;{query}&rdquo;</div>
            )}

            <div className="mt-12 text-center">
              <p className="text-white/15 text-xs tracking-[0.25em] mb-4 uppercase">Name not on the list?</p>
              <button onClick={() => setStage("not_found")} className="group inline-flex items-center gap-2.5 text-[#c4952a]/50 hover:text-[#c4952a] text-[11px] tracking-[0.3em] uppercase font-semibold border border-[#c4952a]/15 hover:border-[#c4952a]/40 px-6 py-3 transition-all duration-300">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Register as Guest
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMING — first name + last initial only, no company/designation */}
        {stage === "confirming" && selected && (
          <div className="w-full max-w-sm text-center animate-scale-in">
            <div className="relative mx-auto mb-8" style={{ width: 96, height: 96 }}>
              <div className="absolute inset-0 rounded-full border border-[#c4952a]/20 animate-expand-ring" />
              <div className="w-full h-full rounded-full border border-[#c4952a]/25 bg-[#c4952a]/[0.06] flex items-center justify-center">
                <span className="font-display text-[#c4952a]" style={{ fontSize: "2.2rem" }}>{selected.firstName[0]}{selected.lastName[0]}</span>
              </div>
            </div>
            <h2 className="font-display text-white mb-1.5" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{selected.firstName} {selected.lastName[0]}.</h2>
            <p className="text-white/25 text-sm mb-10">Is this you?</p>
            <div className="flex items-center gap-5 mb-9"><div className="h-px flex-1 bg-white/[0.07]" /><span className="text-white/20 text-[9px] tracking-[0.4em] uppercase">Confirm Identity</span><div className="h-px flex-1 bg-white/[0.07]" /></div>
            <button onClick={handleConfirm} className="w-full bg-[#c4952a] text-white text-[11px] font-bold tracking-[0.2em] uppercase py-5 hover:bg-[#d4a844] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-3 mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              Yes, That&apos;s Me
            </button>
            <button onClick={resetToSearch} className="w-full text-white/20 hover:text-white/45 text-[11px] tracking-[0.25em] uppercase py-3 transition-colors">← Not Me</button>
          </div>
        )}

        {/* REGISTERED — no QR on screen; QR was emailed at registration time */}
        {stage === "registered" && selected && (
          <div className="w-full max-w-lg text-center animate-scale-in">
            <div className="relative mx-auto mb-10" style={{ width: 100, height: 100 }}>
              <div className="absolute inset-0 rounded-full bg-[#c4952a]/10 blur-2xl scale-[3]" />
              <div className="absolute inset-0 rounded-full border border-[#c4952a]/20 animate-expand-ring" />
              <svg viewBox="0 0 100 100" fill="none" className="absolute inset-0 w-full h-full">
                <circle cx="50" cy="50" r="49" stroke="#c4952a" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M 30 50 L 43 63 L 70 36" stroke="#c4952a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="animate-draw" />
              </svg>
            </div>
            <h2 className="font-display text-white font-light leading-none mb-4" style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}>Welcome, {selected.firstName}!</h2>
            <p className="text-white/40 text-base mb-2 max-w-sm mx-auto">You&apos;re on the list.</p>
            <p className="text-white/25 text-sm mb-10 max-w-xs mx-auto leading-relaxed">Please check your email for your QR pass and present it to staff at the entrance.</p>
            <div className="inline-flex items-center gap-2.5 border border-[#c4952a]/20 text-[#c4952a] text-[10px] font-bold tracking-[0.35em] uppercase px-5 py-2.5 mb-12">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a]" />
              Identity Confirmed
            </div>
            <div>
              <div className="h-px bg-white/[0.06] overflow-hidden"><div className="h-full bg-[#c4952a]/30 animate-countdown" /></div>
              <p className="text-white/15 text-[10px] mt-2.5 tracking-[0.3em] uppercase">Returning to home screen...</p>
            </div>
          </div>
        )}

        {/* NOT FOUND — guest registers via /api/register (no auto-check-in) */}
        {stage === "not_found" && (
          <div className="w-full max-w-md animate-scale-in">
            <div className="relative border border-white/[0.08] p-8">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#c4952a]/40" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#c4952a]/40" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#c4952a]/40" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#c4952a]/40" />
              <div className="text-center mb-8">
                <p className="text-[9px] font-bold text-[#c4952a] tracking-[0.5em] uppercase mb-2">Guest Registration</p>
                <h2 className="font-display text-white text-3xl">Enter Your Details</h2>
                <p className="text-white/25 text-sm mt-2">Your QR pass will be sent to your email.</p>
              </div>
              <form onSubmit={handleGuestSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-bold text-white/30 tracking-[0.25em] uppercase mb-2">First Name</label>
                    <input type="text" required value={guestForm.firstName} onChange={(e) => setGuestForm(p => ({ ...p, firstName: e.target.value }))} placeholder="John" className="input-dark" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-white/30 tracking-[0.25em] uppercase mb-2">Last Name</label>
                    <input type="text" required value={guestForm.lastName} onChange={(e) => setGuestForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" className="input-dark" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-white/30 tracking-[0.25em] uppercase mb-2">Email <span className="text-[#c4952a]">*</span></label>
                  <input type="email" required value={guestForm.email} onChange={(e) => setGuestForm(p => ({ ...p, email: e.target.value }))} placeholder="john@company.com" className="input-dark" />
                </div>
                {guestError && <p className="text-red-400 text-sm animate-fade-in">{guestError}</p>}
                <button type="submit" disabled={guestLoading} className="w-full bg-[#c4952a] text-white text-[11px] font-bold tracking-[0.2em] uppercase py-5 hover:bg-[#d4a844] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 mt-3">
                  {guestLoading ? <><Spinner className="w-4 h-4" /> Registering...</> : "Register — QR Will Be Emailed"}
                </button>
                <button type="button" onClick={resetToSearch} className="w-full text-white/15 hover:text-white/35 text-[10px] tracking-[0.3em] uppercase py-2.5 transition-colors">← Back to Search</button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-4 px-8 border-t border-white/[0.04] text-center">
        <p className="text-white/10 text-[9px] tracking-[0.5em] uppercase">Need assistance? Please approach a staff member.</p>
      </footer>
    </div>
  );
}
