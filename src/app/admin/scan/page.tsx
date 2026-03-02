"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// next/dynamic with ssr:false guarantees html5-qrcode:
//  1. Never runs on the server (no SSR crash)
//  2. Is NOT prefetched on page load (no init-time browser API crash)
//  3. Only loads when <QRScanner> is mounted (button click → scanning=true)
const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => null,
});

interface CheckinResult {
  type: "success" | "warning" | "error";
  name: string;
  message: string;
}

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Ref prevents double-processing when scanner fires multiple times
  const processingRef = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer — ticks every second while result is showing
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const handleScan = useCallback(async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    let resultType: "success" | "warning" | "error" = "error";

    try {
      let token = decodedText.trim();
      try {
        const url = new URL(decodedText);
        const parts = url.pathname.split("/").filter(Boolean);
        token = parts[parts.length - 1] ?? token;
      } catch {
        // bare token — use as-is
      }

      if (!token) {
        setResult({ type: "error", name: "", message: "Invalid QR code." });
        startCountdown(3);
        return;
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });
      const data = await res.json();

      if (res.status === 404) {
        resultType = "error";
        setResult({ type: "error", name: "", message: "QR not found. Use Manual Entry." });
      } else if (!res.ok) {
        resultType = "error";
        setResult({ type: "error", name: "", message: data.error || "Check-in failed." });
      } else if (data.alreadyCheckedIn) {
        resultType = "warning";
        setResult({
          type: "warning",
          name: `${data.attendee.firstName} ${data.attendee.lastName}`,
          message: "Already checked in earlier.",
        });
      } else {
        resultType = "success";
        setResult({
          type: "success",
          name: `${data.attendee.firstName} ${data.attendee.lastName}`,
          message: "Welcome — check-in successful!",
        });
      }
    } catch {
      resultType = "error";
      setResult({ type: "error", name: "", message: "Network error. Try Manual Entry." });
    }

    startCountdown(3);
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          setResult(null);
          processingRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleScannerError = useCallback((msg: string) => {
    setScannerError(msg);
    setScanning(false);
  }, []);

  const startScanning = () => {
    setScannerError(null);
    setResult(null);
    processingRef.current = false;
    setScanning(true);
  };

  const stopScanning = () => {
    setScanning(false);
    processingRef.current = false;
  };

  const resultStyles = {
    success: { wrap: "bg-green-600 border-green-700 shadow-lg shadow-green-600/30", iconBg: "bg-white/20", icon: "text-white", text: "text-green-50", name: "text-white" },
    warning: { wrap: "bg-amber-50 border-amber-200", iconBg: "bg-amber-100", icon: "text-amber-600", text: "text-amber-700", name: "text-[#0a0a0a]" },
    error:   { wrap: "bg-red-50 border-red-200",     iconBg: "bg-red-100",   icon: "text-red-600",   text: "text-red-700",   name: "text-[#0a0a0a]" },
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="font-display text-[#0a0a0a] text-2xl mb-1">QR Scanner</h2>
        <p className="text-[#8a7f6e] text-sm">Point the camera at the attendee&apos;s QR code</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e2d5] overflow-hidden">
        <div className="p-4 sm:p-6">

          {/* Camera viewport — QRScanner mounts here on start */}
          <div
            id="qr-reader"
            className="w-full aspect-square bg-[#0a0a0a] rounded-xl overflow-hidden relative"
          >
            {/* QRScanner dynamically imported with ssr:false — only mounts when scanning=true */}
            {scanning && (
              <QRScanner onScan={handleScan} onError={handleScannerError} />
            )}

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                <div className="absolute top-6 left-6 w-7 h-7 border-t-2 border-l-2 border-[#c4952a]/30 rounded-tl" />
                <div className="absolute top-6 right-6 w-7 h-7 border-t-2 border-r-2 border-[#c4952a]/30 rounded-tr" />
                <div className="absolute bottom-6 left-6 w-7 h-7 border-b-2 border-l-2 border-[#c4952a]/30 rounded-bl" />
                <div className="absolute bottom-6 right-6 w-7 h-7 border-b-2 border-r-2 border-[#c4952a]/30 rounded-br" />
                <svg className="w-12 h-12 text-white/[0.08]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
                <p className="text-white/20 text-sm tracking-wide">Camera inactive</p>
              </div>
            )}
          </div>

          {/* Camera error */}
          {scannerError && (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {scannerError}
            </div>
          )}

          <div className="mt-4">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="w-full bg-[#c4952a] text-white text-sm font-medium py-3.5 rounded-lg hover:bg-[#d4a844] active:bg-[#b8841f] transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Start Scanner
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="w-full bg-[#0a0a0a] text-white text-sm font-medium py-3.5 rounded-lg hover:bg-[#1a1a1a] active:bg-[#2a2a2a] transition-colors"
              >
                Stop Scanner
              </button>
            )}
          </div>
        </div>

        {/* Scan result */}
        {result && (
          <div className={`p-5 sm:p-6 border-t ${resultStyles[result.type].wrap}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${resultStyles[result.type].iconBg}`}>
                {result.type === "success" ? (
                  <svg className={`w-6 h-6 ${resultStyles[result.type].icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              <div className="flex-1 min-w-0">
                {result.name && <p className={`font-bold ${result.type === "success" ? "text-lg" : "text-base"} mb-0.5 ${resultStyles[result.type].name}`}>{result.name}</p>}
                <p className={`${result.type === "success" ? "text-base font-medium" : "text-sm"} ${resultStyles[result.type].text}`}>{result.message}</p>
              </div>
              {countdown > 0 && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${result.type === "success" ? "bg-white/20" : "bg-black/5"}`}>
                  <span className={`text-sm font-bold tabular-nums ${result.type === "success" ? "text-white" : resultStyles[result.type].text}`}>{countdown}</span>
                </div>
              )}
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
