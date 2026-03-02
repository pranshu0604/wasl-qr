"use client";
// This component is ONLY ever imported via next/dynamic({ ssr: false })
// so the top-level html5-qrcode import never executes on the server.
import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onScan: (decodedText: string) => Promise<void>;
  onError: (message: string) => void;
}

export default function QRScanner({ onScan, onError }: Props) {
  // Stable refs — keeps effect deps empty so scanner only starts/stops on mount/unmount
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;

    (async () => {
      try {
        scanner = new Html5Qrcode("qr-reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text) => onScanRef.current(text),
          () => {} // ignore per-frame decode failures
        );
      } catch (err: unknown) {
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
      if (scanner) {
        const s = scanner;
        scanner = null;
        const state = s.getState();
        // Only stop if actually scanning or paused (state 2 or 3)
        if (state === 2 || state === 3) {
          s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch {} });
        } else {
          try { s.clear(); } catch {}
        }
      }
    };
  }, []); // empty — mount starts scanner, unmount stops it

  return null;
}
