"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Header */}
      <header className="bg-charcoal-900 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-display text-gold-400 text-2xl md:text-3xl tracking-[0.2em] uppercase">
            Exclusive Event
          </h1>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-fade-in-up text-center">
          <div className="bg-white rounded-2xl shadow-xl shadow-charcoal-900/5 p-10">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="font-display text-3xl text-charcoal-900 mb-3">
              You&apos;re Registered
            </h2>

            <div className="w-12 h-0.5 bg-gold-400 mx-auto mb-6"></div>

            <p className="text-charcoal-500 text-base leading-relaxed mb-8">
              Your exclusive QR pass has been sent to your email address.
              Please check your inbox (and spam folder) for the event pass.
            </p>

            <div className="p-5 bg-gold-50 border border-gold-200 rounded-xl mb-8">
              <p className="text-charcoal-700 text-sm font-medium mb-1">
                What&apos;s Next?
              </p>
              <p className="text-charcoal-500 text-sm">
                Save the QR code from the email. Present it at the event entrance
                for instant check-in — no waiting in line.
              </p>
            </div>

            {id && (
              <p className="text-charcoal-400 text-xs mb-6">
                Registration ID: <span className="font-mono">{id}</span>
              </p>
            )}

            <Link href="/" className="btn-outline inline-block text-sm">
              Register Another Guest
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
          <p className="text-charcoal-400">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
