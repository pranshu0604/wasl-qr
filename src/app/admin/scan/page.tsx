"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CheckinResult {
  type: "success" | "warning" | "error";
  name: string;
  message: string;
}

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<unknown>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  const handleScan = useCallback(async (decodedText: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      // Extract token from URL
      const url = new URL(decodedText);
      const pathParts = url.pathname.split("/");
      const token = pathParts[pathParts.length - 1];

      if (!token) {
        setResult({ type: "error", name: "", message: "Invalid QR code format." });
        setProcessing(false);
        return;
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          type: "error",
          name: "",
          message: data.error || "Check-in failed.",
        });
      } else if (data.alreadyCheckedIn) {
        setResult({
          type: "warning",
          name: `${data.attendee.firstName} ${data.attendee.lastName}`,
          message: "Already checked in!",
        });
      } else {
        setResult({
          type: "success",
          name: `${data.attendee.firstName} ${data.attendee.lastName}`,
          message: "Welcome! Check-in successful.",
        });
      }
    } catch {
      setResult({
        type: "error",
        name: "",
        message: "Could not read QR code. Try manual entry.",
      });
    }

    // Auto-clear after 4 seconds
    setTimeout(() => {
      setResult(null);
      setProcessing(false);
    }, 4000);
  }, [processing]);

  const startScanner = useCallback(async () => {
    if (!readerRef.current) return;

    try {
      // Dynamic import — html5-qrcode uses browser APIs, cannot be imported at top level
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
        },
        handleScan,
        () => {} // ignore errors while scanning
      );

      setScanning(true);
    } catch (err) {
      console.error("Scanner error:", err);
      setResult({
        type: "error",
        name: "",
        message: "Camera access denied. Please enable camera permissions.",
      });
    }
  }, [handleScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scanner = scannerRef.current as { stop: () => Promise<void>; clear: () => void };
        await scanner.stop();
        scanner.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const scanner = scannerRef.current as { stop: () => Promise<void> };
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl text-charcoal-900 mb-2">QR Scanner</h2>
        <p className="text-charcoal-500 text-sm">Point the camera at the attendee&apos;s QR code</p>
      </div>

      {/* Scanner Area */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div
            ref={readerRef}
            id="qr-reader"
            className="w-full aspect-square bg-charcoal-900 rounded-xl overflow-hidden relative"
          >
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-charcoal-400 gap-4">
                <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
                <p className="text-sm">Camera inactive</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex gap-3">
            {!scanning ? (
              <button onClick={startScanner} className="btn-gold w-full flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                Start Scanner
              </button>
            ) : (
              <button onClick={stopScanner} className="btn-primary w-full">
                Stop Scanner
              </button>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`p-6 border-t ${
              result.type === "success"
                ? "bg-green-50 border-green-200"
                : result.type === "warning"
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  result.type === "success"
                    ? "bg-green-100"
                    : result.type === "warning"
                    ? "bg-amber-100"
                    : "bg-red-100"
                }`}
              >
                {result.type === "success" ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : result.type === "warning" ? (
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                {result.name && (
                  <p className="font-semibold text-charcoal-900 text-lg">{result.name}</p>
                )}
                <p
                  className={`text-sm ${
                    result.type === "success"
                      ? "text-green-700"
                      : result.type === "warning"
                      ? "text-amber-700"
                      : "text-red-700"
                  }`}
                >
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tip */}
      <div className="p-4 bg-white rounded-xl shadow-sm border-l-3 border-l-gold-400">
        <p className="text-charcoal-600 text-sm">
          <strong>Tip:</strong> If QR code is unreadable, use the{" "}
          <a href="/admin/manual" className="text-gold-600 underline">
            Manual Entry
          </a>{" "}
          page to check in the visitor.
        </p>
      </div>
    </div>
  );
}
