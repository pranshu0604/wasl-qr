"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h2 className="font-display text-[#0a0a0a] text-xl mb-2">Something went wrong</h2>
        <p className="text-[#8a7f6e] text-sm max-w-sm">
          An unexpected error occurred. Click retry to reload this page.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#c4952a] text-white text-sm font-medium rounded-lg hover:bg-[#d4a844] transition-colors"
        >
          Retry
        </button>
        <Link
          href="/admin"
          className="px-5 py-2.5 bg-white border border-[#e0d8ca] text-[#6b6359] text-sm font-medium rounded-lg hover:bg-[#faf7f2] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
