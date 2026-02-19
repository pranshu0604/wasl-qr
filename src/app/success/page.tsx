"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-dot-grid flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#c4952a]/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#c4952a]/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Top brand */}
      <header className="relative z-10 py-7 px-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-px bg-[#c4952a]/30" />
          <span className="font-display text-[#c4952a] text-sm tracking-[0.35em] uppercase">
            Exclusive Event
          </span>
          <div className="w-12 h-px bg-[#c4952a]/30" />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center animate-fade-in-up">

          {/* Check icon */}
          <div className="relative mx-auto mb-8 w-fit">
            <div className="w-20 h-20 rounded-full border border-[#c4952a]/25 bg-[#c4952a]/5 flex items-center justify-center">
              <svg className="w-9 h-9 text-[#c4952a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border border-[#c4952a]/10 scale-[1.3] animate-ping" style={{ animationDuration: "3s" }} />
          </div>

          {/* Heading */}
          <h1 className="font-display text-white text-5xl md:text-6xl mb-4">
            You&apos;re Confirmed
          </h1>

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-4 mb-7">
            <div className="w-16 h-px bg-[#c4952a]/25" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c4952a]" />
            <div className="w-16 h-px bg-[#c4952a]/25" />
          </div>

          <p className="text-white/45 text-base leading-relaxed mb-9 max-w-sm mx-auto">
            Your exclusive QR pass has been sent to your email address.
            Please check your inbox — and spam folder — for your event pass.
          </p>

          {/* Info card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-left mb-8">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-[#c4952a]/10 border border-[#c4952a]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-[#c4952a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium mb-1.5">What to do at the event</p>
                <p className="text-white/35 text-sm leading-relaxed">
                  Save the QR code from your email. Present it at the entrance for
                  instant check-in — no queuing required.
                </p>
              </div>
            </div>
          </div>

          {id && (
            <p className="text-white/15 text-xs font-mono mb-7 tracking-widest">
              REF: {id.slice(0, 16).toUpperCase()}
            </p>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[#c4952a] hover:text-[#d4a844] text-sm font-medium border border-[#c4952a]/25 hover:border-[#c4952a]/50 px-6 py-3 rounded-lg transition-all"
          >
            Register Another Guest
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center border-t border-white/[0.05]">
        <p className="text-white/15 text-xs tracking-widest uppercase">Exclusive Event · 2025</p>
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#c4952a]/30 border-t-[#c4952a] rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
