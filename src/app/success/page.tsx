"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

interface Attendee {
  firstName: string;
  lastName: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [attendee, setAttendee] = useState<Attendee | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/attendee/${id}`)
      .then((r) => r.json())
      .then((data) => setAttendee(data))
      .catch(() => {});
  }, [id]);

  const handleDownload = () => {
    if (!id) return;
    const link = document.createElement("a");
    link.href = `/api/qr-image/${id}`;
    link.download = `event-pass.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col relative overflow-hidden">

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(196,149,42,0.07) 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #c4952a 0, #c4952a 1px, transparent 0, transparent 50%)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c4952a]/40 to-transparent" />

      {/* Header */}
      <header className="relative z-10 py-5 px-4 sm:py-8 sm:px-8">
        <div className="flex items-center justify-center gap-4 sm:gap-5">
          <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-[#c4952a]/35" />
          <img src="/wasl-logo.png" alt="wasl" className="h-5 sm:h-6 w-auto brightness-0 invert opacity-80" />
          <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-[#c4952a]/35" />
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-[560px] animate-fade-in-up">

          {/* Heading block */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="relative mx-auto mb-6 sm:mb-10" style={{ width: 72, height: 72 }}>
              <div className="absolute inset-0 rounded-full border border-[#c4952a]/20 animate-expand-ring" />
              <svg viewBox="0 0 88 88" fill="none" className="absolute inset-0 w-full h-full">
                <circle cx="44" cy="44" r="43" stroke="#c4952a" strokeWidth="1" strokeOpacity="0.2" />
                <path
                  d="M 26 44 L 38 56 L 62 32"
                  stroke="#c4952a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="animate-draw"
                />
              </svg>
            </div>

            <h1
              className="font-display text-white mb-4 sm:mb-5 leading-none"
              style={{ fontSize: "clamp(2.2rem, 8vw, 5rem)" }}
            >
              {attendee ? `Welcome, ${attendee.firstName}.` : "You're Confirmed."}
            </h1>

            <div className="flex items-center justify-center gap-4 sm:gap-5 mb-4 sm:mb-6">
              <div className="h-px w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#c4952a]/25" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a]/60" />
              <div className="h-px w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#c4952a]/25" />
            </div>

            <p className="text-white/40 text-sm sm:text-[15px] leading-[1.8] max-w-[300px] sm:max-w-[360px] mx-auto">
              Your event pass is ready. Download your QR code and present it at the entrance.
            </p>
          </div>

          {/* QR Card */}
          <div className="border border-white/[0.07] relative mb-4 sm:mb-6">
            <div className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 border-t border-l border-[#c4952a]/40" />
            <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 border-t border-r border-[#c4952a]/40" />
            <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 border-b border-l border-[#c4952a]/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 border-b border-r border-[#c4952a]/40" />

            {/* Card top bar */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-[9px] font-bold text-[#c4952a] tracking-[0.4em] uppercase">
                  Event Pass
                </p>
                {attendee && (
                  <p className="text-white/40 text-xs mt-0.5">
                    {attendee.firstName} {attendee.lastName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a] animate-pulse" />
                <span className="text-[#c4952a] text-[10px] font-semibold tracking-widest uppercase">
                  Valid
                </span>
              </div>
            </div>

            {/* QR image */}
            <div className="flex justify-center py-6 px-4 sm:py-8 sm:px-6">
              {id ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-[#c4952a]/5 blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                  <div className="relative bg-white p-3 rounded-xl shadow-2xl">
                    <img
                      src={`/api/qr-image/${id}`}
                      alt="Your Event QR Pass"
                      width={200}
                      height={200}
                      className="block rounded-lg w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]"
                    />
                  </div>
                  <p className="text-center text-white/20 text-[10px] tracking-[0.3em] uppercase mt-3 sm:mt-4">
                    Scan at entrance
                  </p>
                </div>
              ) : (
                <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] flex items-center justify-center">
                  <div className="w-8 h-8 border border-[#c4952a]/30 border-t-[#c4952a] rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
              <button
                onClick={handleDownload}
                disabled={!id}
                className="w-full flex items-center justify-center gap-2 bg-[#c4952a] hover:bg-[#d4a844] disabled:opacity-40 text-black text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-3.5 transition-colors"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download QR Code
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="border border-white/[0.06] px-4 py-5 sm:px-7 sm:py-6 mb-4 sm:mb-6">
            <p className="text-[9px] font-bold text-[#c4952a] tracking-[0.4em] uppercase mb-4 sm:mb-5">
              What to do next
            </p>
            <div className="space-y-4 sm:space-y-5">
              {[
                { n: "01", title: "Save your QR code", desc: "Download it or screenshot this page. Keep it on your phone." },
                { n: "02", title: "Check your inbox", desc: "A copy was sent to your email. Check spam if you don't see it." },
                { n: "03", title: "Show at the door", desc: "Present your QR at the entrance for instant access. No printing needed." },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-3 sm:gap-4">
                  <span className="text-[#c4952a]/40 text-[11px] font-mono font-bold mt-0.5 w-6 flex-shrink-0">{n}</span>
                  <div>
                    <p className="text-white/60 text-sm font-medium mb-0.5">{title}</p>
                    <p className="text-white/25 text-xs sm:text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="border border-[#c4952a]/15 bg-[#c4952a]/[0.04] px-4 py-4 sm:px-6 mb-8 sm:mb-10">
            <p className="text-[9px] font-bold text-[#c4952a]/70 tracking-[0.4em] uppercase mb-1">
              Notice
            </p>
            <p className="text-white/30 text-xs sm:text-sm leading-relaxed">
              This QR code is unique to you and valid for one entry only. Do not share it with anyone else.
            </p>
          </div>

          {/* Bottom */}
          <div className="text-center space-y-4 sm:space-y-5">
            {id && (
              <p className="text-white/15 text-[10px] font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                Ref: {id.slice(0, 16)}
              </p>
            )}

            <Link
              href="/"
              className="group inline-flex items-center gap-3 text-[#c4952a] text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase font-semibold border border-[#c4952a]/25 hover:border-[#c4952a]/60 px-6 sm:px-7 py-3 sm:py-3.5 transition-all duration-300"
            >
              Register Another Guest
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </Link>
          </div>

        </div>
      </main>

      <footer className="relative z-10 py-4 sm:py-5 text-center border-t border-white/[0.05]">
        <p className="text-white/10 text-[9px] tracking-[0.4em] sm:tracking-[0.5em] uppercase">Wasl Suhoor Gathering 2026</p>
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
          <div className="w-8 h-8 border border-[#c4952a]/30 border-t-[#c4952a] rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
