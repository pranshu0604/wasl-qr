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

export default function AdminDashboard() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<string | null>(null);
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

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) { setImportResult("CSV must have a header row and at least one data row."); return; }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const attendeesToImport = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
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

  const checkedInPercent = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-[#0a0a0a] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#c4952a]/5 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-white/35 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Total Registered</p>
          <p className="font-display text-white text-4xl">{stats.total.toLocaleString()}</p>
        </div>

        {/* Checked in */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d5] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-[#8a7f6e] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Checked In</p>
          <p className="font-display text-green-600 text-4xl">{stats.checkedIn.toLocaleString()}</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e2d5] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#fdf3e0] rounded-full -translate-y-8 translate-x-8" />
          <p className="text-[#8a7f6e] text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Pending</p>
          <p className="font-display text-[#c4952a] text-4xl">{stats.pending.toLocaleString()}</p>
        </div>

        {/* Rate */}
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
          {/* Search */}
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

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-[#faf7f2] border border-[#e0d8ca] rounded-lg text-sm text-[#0a0a0a] focus:outline-none focus:border-[#c4952a] focus:ring-1 focus:ring-[#c4952a]/25 transition-all"
          >
            <option value="all">All Attendees</option>
            <option value="checked-in">Checked In</option>
            <option value="not-checked-in">Not Checked In</option>
          </select>

          {/* Import */}
          <label className="flex items-center gap-2 px-4 py-2.5 bg-[#faf7f2] border border-[#e0d8ca] rounded-lg text-sm text-[#6b6359] cursor-pointer hover:bg-[#f0ead8] hover:border-[#c4952a]/40 transition-all font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import CSV
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>

          {/* Refresh */}
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex items-center justify-center gap-3 text-[#a89e8a]">
                      <div className="w-5 h-5 border-2 border-[#c4952a]/30 border-t-[#c4952a] rounded-full animate-spin" />
                      <span className="text-sm">Loading attendees...</span>
                    </div>
                  </td>
                </tr>
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#a89e8a] text-sm">
                    No attendees found.
                  </td>
                </tr>
              ) : (
                attendees.map((a) => (
                  <tr key={a.id} className="border-b border-[#faf5ed] hover:bg-[#fdf9f4] transition-colors">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0e8d8]">
            <p className="text-sm text-[#a89e8a]">
              Page {page} of {totalPages}
            </p>
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
    </div>
  );
}
