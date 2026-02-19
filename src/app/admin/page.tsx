"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string | null;
  designation: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  source: string;
  createdAt: string;
}

interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
}

const sourceBadge: Record<string, string> = {
  online: "bg-blue-50 text-blue-600 border border-blue-200",
  manual: "bg-violet-50 text-violet-600 border border-violet-200",
  import: "bg-[#f5f0e8] text-[#8a7f6e] border border-[#e0d8ca]",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Attendee QR Modal ────────────────────────────────────────────────────────
function AttendeeModal({
  attendee,
  onClose,
  onCheckinToggle,
}: {
  attendee: Attendee;
  onClose: () => void;
  onCheckinToggle: (id: string, checkedIn: boolean) => void;
}) {
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [checkinLoading, setCheckinLoading] = useState(false);

  const handleResend = async () => {
    if (resendState === "loading") return; // prevent double-click
    setResendState("loading");
    try {
      const res = await fetch("/api/resend-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attendee.id }),
      });
      setResendState(res.ok ? "sent" : "error");
    } catch {
      setResendState("error");
    }
    // Single timeout — always reset to idle after 3 s regardless of outcome
    setTimeout(() => setResendState("idle"), 3000);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/api/qr-image/${attendee.id}`;
    link.download = `qr-${attendee.firstName}-${attendee.lastName}.png`;
    link.click();
  };

  const handleCheckinToggle = async () => {
    setCheckinLoading(true);
    try {
      const res = await fetch("/api/toggle-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attendee.id }),
      });
      if (res.ok) {
        const data = await res.json();
        onCheckinToggle(attendee.id, data.checkedIn);
      }
    } catch {
      /* silent */
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#f0e8d8] bg-[#faf7f2]">
          <div>
            <h2 className="font-display text-[#0a0a0a] text-xl leading-tight">
              {attendee.firstName} {attendee.lastName}
            </h2>
            <p className="text-[#8a7f6e] text-sm mt-0.5">{attendee.email}</p>
          </div>
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            {attendee.checkedIn ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Checked In
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fdf3e0] text-[#c4952a] border border-[#c4952a]/25">
                <span className="w-1.5 h-1.5 bg-[#c4952a] rounded-full" />
                Pending
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f0e8d8] rounded-lg transition-colors text-[#8a7f6e] hover:text-[#0a0a0a]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row">
          {/* Left: Details */}
          <div className="flex-1 p-6 space-y-4">
            <p className="text-[10px] font-semibold text-[#a89e8a] tracking-[0.2em] uppercase mb-3">
              Attendee Details
            </p>

            <DetailRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              }
              label="Phone"
              value={attendee.phone}
            />

            {attendee.company && (
              <DetailRow
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                }
                label="Company"
                value={attendee.company}
              />
            )}

            {attendee.designation && (
              <DetailRow
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.193.163-.43.295-.69.395m-11.12-8.4c-.193.163-.43.295-.69.395" />
                  </svg>
                }
                label="Designation"
                value={attendee.designation}
              />
            )}

            <DetailRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              }
              label="Source"
              value={
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${sourceBadge[attendee.source] || sourceBadge.import}`}>
                  {attendee.source}
                </span>
              }
            />

            <DetailRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
              label="Registered"
              value={formatDate(attendee.createdAt)}
            />

            {attendee.checkedIn && attendee.checkedInAt && (
              <DetailRow
                icon={
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Checked In At"
                value={formatDate(attendee.checkedInAt)}
                valueClass="text-green-600"
              />
            )}

            {/* Toggle check-in */}
            <div className="pt-2">
              <button
                onClick={handleCheckinToggle}
                disabled={checkinLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  attendee.checkedIn
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-700 hover:bg-green-50"
                }`}
              >
                {checkinLoading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : attendee.checkedIn ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Undo Check-in
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Mark as Checked In
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: QR */}
          <div className="md:w-[240px] border-t md:border-t-0 md:border-l border-[#f0e8d8] p-6 flex flex-col items-center gap-4 bg-[#fdfaf6]">
            <p className="text-[10px] font-semibold text-[#a89e8a] tracking-[0.2em] uppercase self-start">
              Event Pass QR
            </p>

            {/* QR image — same endpoint used in emails and success page */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-[#e8e2d5]">
              <img
                src={`/api/qr-image/${attendee.id}`}
                alt="Event QR Pass"
                width={180}
                height={180}
                className="block rounded-lg"
              />
            </div>

            <p className="text-[10px] text-[#b8b0a0] tracking-[0.25em] uppercase text-center">
              Scan at entrance
            </p>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-[#0a0a0a] hover:bg-[#1a1a1a] text-white text-xs font-medium tracking-wide py-2.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download QR
            </button>

            {/* Resend email */}
            <button
              onClick={handleResend}
              disabled={resendState === "loading"}
              className={`w-full flex items-center justify-center gap-2 text-xs font-medium tracking-wide py-2.5 rounded-lg border transition-all disabled:opacity-50 ${
                resendState === "sent"
                  ? "border-green-300 text-green-600 bg-green-50"
                  : resendState === "error"
                  ? "border-red-300 text-red-600 bg-red-50"
                  : "border-[#e0d8ca] text-[#6b6359] hover:bg-[#f0e8d8] hover:border-[#c4952a]/40"
              }`}
            >
              {resendState === "loading" ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : resendState === "sent" ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Email Sent
                </>
              ) : resendState === "error" ? (
                "Failed — Retry"
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Resend QR Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClass = "text-[#2a2219]",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#b8b0a0] mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-[#a89e8a] tracking-[0.15em] uppercase mb-0.5">{label}</p>
        <div className={`text-sm ${valueClass} break-all`}>{value}</div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, filter, page: String(page), limit: "50" });
      const res = await fetch(`/api/attendees?${params}`);
      const data = await res.json();
      setAttendees(data.attendees);
      setStats(data.stats);
      setTotalPages(data.pagination.pages);
    } catch {
      console.error("Failed to fetch attendees");
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => { fetchAttendees(); }, [fetchAttendees]);
  useEffect(() => {
    const interval = setInterval(fetchAttendees, 10000);
    return () => clearInterval(interval);
  }, [fetchAttendees]);

  // Keep selected attendee in sync when table refreshes
  useEffect(() => {
    if (selectedAttendee) {
      const updated = attendees.find((a) => a.id === selectedAttendee.id);
      if (updated) setSelectedAttendee(updated);
    }
  }, [attendees]); // eslint-disable-line react-hooks/exhaustive-deps

  // RFC-4180 compliant CSV line parser — handles quoted fields with embedded commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } // escaped quote
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim()); current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) { setImportResult("CSV must have a header row and at least one data row."); return; }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const attendeesToImport = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const entry: Record<string, string> = {};
      headers.forEach((header, idx) => {
        const val = values[idx] || "";
        if (header.includes("first")) entry.firstName = val;
        else if (header.includes("last")) entry.lastName = val;
        else if (header.includes("email")) entry.email = val;
        else if (header.includes("phone") || header.includes("mobile")) entry.phone = val;
        else if (header.includes("company") || header.includes("org")) entry.company = val;
        else if (header.includes("designation") || header.includes("title") || header.includes("role")) entry.designation = val;
      });
      if (entry.firstName && entry.email) attendeesToImport.push(entry);
    }
    if (attendeesToImport.length === 0) { setImportResult("No valid records found. CSV must have columns: firstName, lastName, email, phone"); return; }
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendees: attendeesToImport }),
      });
      const data = await res.json();
      setImportResult(data.message);
      fetchAttendees();
    } catch {
      setImportResult("Import failed. Please try again.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCheckinToggle = (id: string, checkedIn: boolean) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, checkedIn, checkedInAt: checkedIn ? new Date().toISOString() : null }
          : a
      )
    );
    if (selectedAttendee?.id === id) {
      setSelectedAttendee((prev) =>
        prev ? { ...prev, checkedIn, checkedInAt: checkedIn ? new Date().toISOString() : null } : prev
      );
    }
  };

  const checkedInPercent = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#c4952a]/5 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-white/35 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Total Registered</p>
          <p className="font-display text-white text-4xl">{stats.total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d5] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-[#8a7f6e] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Checked In</p>
          <p className="font-display text-green-600 text-4xl">{stats.checkedIn.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d5] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#fdf3e0] rounded-full -translate-y-8 translate-x-8" />
          <p className="text-[#8a7f6e] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Pending</p>
          <p className="font-display text-[#c4952a] text-4xl">{stats.pending.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d5]">
          <p className="text-[#8a7f6e] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Check-in Rate</p>
          <p className="font-display text-[#0a0a0a] text-4xl mb-3">{checkedInPercent}%</p>
          <div className="w-full bg-[#f0ead8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#c4952a] h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${checkedInPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Actions Bar ─── */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e2d5]">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a89e8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#faf7f2] border border-[#e0d8ca] rounded-lg text-sm text-[#0a0a0a] placeholder:text-[#b8b0a0] focus:outline-none focus:border-[#c4952a] focus:ring-1 focus:ring-[#c4952a]/25 transition-all"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-[#faf7f2] border border-[#e0d8ca] rounded-lg text-sm text-[#0a0a0a] focus:outline-none focus:border-[#c4952a] focus:ring-1 focus:ring-[#c4952a]/25 transition-all"
          >
            <option value="all">All Attendees</option>
            <option value="checked-in">Checked In</option>
            <option value="not-checked-in">Not Checked In</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-[#faf7f2] border border-[#e0d8ca] rounded-lg text-sm text-[#6b6359] cursor-pointer hover:bg-[#f0ead8] hover:border-[#c4952a]/40 transition-all font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import CSV
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>

          <button
            onClick={fetchAttendees}
            className="p-2.5 bg-[#faf7f2] border border-[#e0d8ca] rounded-lg hover:bg-[#f0ead8] hover:border-[#c4952a]/40 transition-all"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-[#8a7f6e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {importResult && (
          <div className="mt-4 px-4 py-3 bg-[#fdf3e0] border border-[#c4952a]/25 rounded-lg text-sm text-[#6b4c1a]">
            {importResult}
          </div>
        )}
      </div>

      {/* ─── Table ─── */}
      <div className="bg-white rounded-2xl border border-[#e8e2d5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0e8d8]">
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase">Name</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase">Email</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase">Phone</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase">Company</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase">Source</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-[#a89e8a] tracking-[0.18em] uppercase text-right">Pass</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-3 text-[#a89e8a]">
                      <div className="w-5 h-5 border-2 border-[#c4952a]/30 border-t-[#c4952a] rounded-full animate-spin" />
                      <span className="text-sm">Loading attendees...</span>
                    </div>
                  </td>
                </tr>
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[#a89e8a] text-sm">
                    No attendees found.
                  </td>
                </tr>
              ) : (
                attendees.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAttendee(a)}
                    className="border-b border-[#faf5ed] hover:bg-[#fdf9f4] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0a0a0a] text-sm">{a.firstName} {a.lastName}</p>
                      {a.designation && (
                        <p className="text-xs text-[#a89e8a] mt-0.5">{a.designation}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b6359]">{a.email}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6359]">{a.phone}</td>
                    <td className="px-6 py-4 text-sm text-[#6b6359]">{a.company || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${sourceBadge[a.source] || sourceBadge.import}`}>
                        {a.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fdf3e0] text-[#c4952a] border border-[#c4952a]/25">
                          <span className="w-1.5 h-1.5 bg-[#c4952a] rounded-full" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAttendee(a); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#8a7f6e] border border-[#e0d8ca] hover:border-[#c4952a]/40 hover:text-[#c4952a] hover:bg-[#fdf3e0] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                        </svg>
                        View QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0e8d8]">
            <p className="text-sm text-[#a89e8a]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 text-sm border border-[#e0d8ca] rounded-lg text-[#6b6359] disabled:opacity-40 hover:bg-[#faf7f2] hover:border-[#c4952a]/40 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-1.5 text-sm border border-[#e0d8ca] rounded-lg text-[#6b6359] disabled:opacity-40 hover:bg-[#faf7f2] hover:border-[#c4952a]/40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Attendee QR Modal ─── */}
      {selectedAttendee && (
        <AttendeeModal
          attendee={selectedAttendee}
          onClose={() => setSelectedAttendee(null)}
          onCheckinToggle={handleCheckinToggle}
        />
      )}
    </div>
  );
}
