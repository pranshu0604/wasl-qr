"use client";
// This component is ONLY ever imported via next/dynamic({ ssr: false })
// so the top-level html5-qrcode import never executes on the server.
import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Module-level promise that tracks the previous scanner's cleanup.
// Prevents race conditions when stop → start happens quickly.
let cleanupPromise: Promise<void> = Promise.resolve();

interface Props {
  onScan: (decodedText: string) => Promise<void>;
  onError: (message: string) => void;
}

export default function QRScanner({ onScan, onError }: Props) {
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    (async () => {
      // Wait for any previous scanner to fully stop before starting a new one
      await cleanupPromise;
      if (cancelled) return;

      // Clear leftover DOM children from previous scanner instance
      const container = document.getElementById("qr-reader");
      if (container) container.innerHTML = "";
      if (cancelled) return;

      try {
        scanner = new Html5Qrcode("qr-reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => onScanRef.current(text),
          () => {} // ignore per-frame decode failures
        );
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        const lower = msg.toLowerCase();
        if (lower.includes("permission") || lower.includes("denied") || lower.includes("notallowed")) {
          onErrorRef.current("Camera access denied. Allow camera permissions in your browser and try again.");
        } else if (lower.includes("camera") || lower.includes("device") || lower.includes("found") || lower.includes("media")) {
          onErrorRef.current("No camera found. Make sure your device has a working camera.");
        } else {
          onErrorRef.current("Could not start camera. Refresh and try again, or use Manual Entry below.");
        }
        scanner = null;
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        const s = scanner;
        scanner = null;
        // Store the cleanup promise so the next mount waits for it
        cleanupPromise = (async () => {
          try {
            const state = s.getState();
            if (state === 2 || state === 3) {
              await s.stop();
            }
          } catch {
            // ignore stop errors
          }
          try { s.clear(); } catch {}
        })();
      }
    };
  }, []);

  return null;
}
