"use client";
// This component is ONLY ever imported via next/dynamic({ ssr: false })
// so the top-level qr-scanner import never executes on the server.
import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";

interface Props {
  onScan: (decodedText: string) => Promise<void>;
  onError: (message: string) => void;
}

export default function QRScanner({ onScan, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(
      video,
      (result) => {
        onScanRef.current(result.data);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      }
    );

    scanner.start().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (lower.includes("permission") || lower.includes("denied") || lower.includes("notallowed")) {
        onErrorRef.current("Camera access denied. Allow camera permissions in your browser and try again.");
      } else if (lower.includes("camera") || lower.includes("device") || lower.includes("found") || lower.includes("media")) {
        onErrorRef.current("No camera found. Make sure your device has a working camera.");
      } else {
        onErrorRef.current("Could not start camera. Refresh and try again, or use Manual Entry below.");
      }
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      style={{ transform: "scaleX(1)" }}
    />
  );
}
