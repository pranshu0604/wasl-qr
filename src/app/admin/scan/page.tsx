"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface CheckinResult {
  type: "success" | "warning" | "error";
  name: string;
  message: string;
}

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);

  // useRef instead of useState — the scanner library holds a stale reference to
  // the callback passed at start() time, so useState would always read the old
  // captured value. The ref is always current regardless of closure age.
  const processingRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      // Accept both a full verify URL and a bare token
      let token = decodedText.trim();
      try {
        const url = new URL(decodedText);
        const parts = url.pathname.split("/").filter(Boolean);
        token = parts[parts.length - 1] ?? token;
      } catch {
        // decodedText is already the raw token — use it as-is
      }

      if (!token) {
        setResult({ type: "error", name: "", message: "Invalid QR code — nothing to scan." });
        setTimeout(() => { setResult(null); processingRef.current = false; }, 4000);
        return;
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await res.json();

      if (res.status === 404) {
        setResult({ type: "error", name: "", message: "QR code not found. Use Manual Entry." });
      } else if (!res.ok) {
        setResult({ type: "error", name: "", message: data.error || "Check-in failed." });
      } else if (data.alreadyCheckedIn) {
        setResult({
          type: "warning",
          name: `${data.attendee.firstName} ${data.attendee.lastName}`,
          message: "Already checked in earlier.",
        });
      } else {
        setResult({
          type: "success",
          name: `${data.attendee.firstName} ${data.attendee.lastName}`,
          message: "Welcome — check-in successful!",
        });
      }
    } catch {
      setResult({ type: "error", name: "", message: "Could not process QR code. Try Manual Entry." });
    }

    setTimeout(() => { setResult(null); processingRef.current = false; }, 4000);
  }, []); // no state deps — reads processingRef directly

  const startScanner = useCallback(async () => {
    if (!readerRef.current) return;
    try {
      // Dynamic import — html5-qrcode accesses window/document at module load
      // time which crashes Next.js SSR on Vercel. Import only on button click.
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        handleScan,
        () => {} // ignore individual frame errors
      );
      setScanning(true);
    } catch {
      setResult({ type: "error", name: "", message: "Camera access denied. Enable camera permissions and try again." });
    }
  }, [handleScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* scanner may already be stopped */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const resultStyles = {
    success: { wrap: "bg-green-50 border-green-200", iconBg: "bg-green-100", icon: "text-green-600", text: "text-green-700" },
    warning: { wrap: "bg-amber-50 border-amber-200", iconBg: "bg-amber-100", icon: "text-amber-600", text: "text-amber-700" },
    error:   { wrap: "bg-red-50 border-red-200",     iconBg: "bg-red-100",   icon: "text-red-600",   text: "text-red-700"   },
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="font-display text-[#0a0a0a] text-2xl mb-1">QR Scanner</h2>
        <p className="text-[#8a7f6e] text-sm">Point the camera at the attendee&apos;s QR code</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e2d5] overflow-hidden">
        <div className="p-6">
          <div
            ref={readerRef}
            id="qr-reader"
            className="w-full aspect-square bg-[#0a0a0a] rounded-xl overflow-hidden relative"
          >
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#c4952a]/30 rounded-tl" />
                <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[#c4952a]/30 rounded-tr" />
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#c4952a]/30 rounded-bl" />
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#c4952a]/30 rounded-br" />
                <svg className="w-14 h-14 text-white/[0.08]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
                <p className="text-white/20 text-sm tracking-wide">Camera inactive</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="w-full bg-[#c4952a] text-white text-sm font-medium py-3.5 rounded-lg hover:bg-[#d4a844] transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Start Scanner
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="w-full bg-[#0a0a0a] text-white text-sm font-medium py-3.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                Stop Scanner
              </button>
            )}
          </div>
        </div>

        {result && (
          <div className={`p-5 border-t animate-fade-in ${resultStyles[result.type].wrap}`}>
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${resultStyles[result.type].iconBg}`}>
                {result.type === "success" ? (
                  <svg className={`w-5 h-5 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : result.type === "warning" ? (
                  <svg className={`w-5 h-5 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg className={`w-5 h-5 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                {result.name && <p className="font-semibold text-[#0a0a0a] text-base mb-0.5">{result.name}</p>}
                <p className={`text-sm ${resultStyles[result.type].text}`}>{result.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5 bg-[#fdf3e0] border border-[#c4952a]/20 rounded-xl">
        <svg className="w-4 h-4 text-[#c4952a] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-[#6b4c1a] text-sm">
          If QR code is unreadable, use{" "}
          <Link href="/admin/manual" className="font-medium underline underline-offset-2 hover:text-[#c4952a] transition-colors">
            Manual Entry
          </Link>{" "}
          to check in the visitor.
        </p>
      </div>
    </div>
  );
}
