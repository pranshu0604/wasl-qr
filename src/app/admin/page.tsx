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
      const params = new URLSearchParams({
        search,
        filter,
        page: String(page),
        limit: "50",
      });
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

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  // Auto-refresh every 10 seconds
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

    if (lines.length < 2) {
      setImportResult("CSV file must have a header row and at least one data row.");
      return;
    }

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

      if (entry.firstName && entry.email) {
        attendeesToImport.push(entry);
      }
    }

    if (attendeesToImport.length === 0) {
      setImportResult("No valid records found. CSV must have columns: firstName, lastName, email, phone");
      return;
    }

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

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const checkedInPercent = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-charcoal-400 text-xs font-medium tracking-wider uppercase mb-1">Total Registered</p>
          <p className="text-3xl font-semibold text-charcoal-900">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-charcoal-400 text-xs font-medium tracking-wider uppercase mb-1">Checked In</p>
          <p className="text-3xl font-semibold text-green-600">{stats.checkedIn.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-charcoal-400 text-xs font-medium tracking-wider uppercase mb-1">Pending</p>
          <p className="text-3xl font-semibold text-gold-500">{stats.pending.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-charcoal-400 text-xs font-medium tracking-wider uppercase mb-1">Check-in Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-semibold text-charcoal-900">{checkedInPercent}%</p>
          </div>
          <div className="mt-2 w-full bg-charcoal-100 rounded-full h-2">
            <div
              className="bg-gold-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${checkedInPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-charcoal-50 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-charcoal-50 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
            >
              <option value="all">All Attendees</option>
              <option value="checked-in">Checked In</option>
              <option value="not-checked-in">Not Checked In</option>
            </select>
          </div>

          {/* Import CSV */}
          <div className="flex items-center gap-3">
            <label className="btn-outline text-sm cursor-pointer py-2.5 px-5">
              <span>Import CSV</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
            </label>
            <button onClick={fetchAttendees} className="p-2.5 border border-charcoal-200 rounded-lg hover:bg-charcoal-50 transition-colors">
              <svg className="w-4 h-4 text-charcoal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {importResult && (
          <div className="mt-4 p-3 bg-gold-50 border border-gold-200 rounded-lg text-sm text-charcoal-700">
            {importResult}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-charcoal-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Phone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Company</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Source</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-charcoal-500 tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-charcoal-400">
                    Loading...
                  </td>
                </tr>
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-charcoal-400">
                    No attendees found.
                  </td>
                </tr>
              ) : (
                attendees.map((a) => (
                  <tr key={a.id} className="border-b border-charcoal-50 hover:bg-charcoal-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-charcoal-900">{a.firstName} {a.lastName}</p>
                      {a.designation && (
                        <p className="text-xs text-charcoal-400 mt-0.5">{a.designation}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal-600">{a.email}</td>
                    <td className="px-6 py-4 text-sm text-charcoal-600">{a.phone}</td>
                    <td className="px-6 py-4 text-sm text-charcoal-600">{a.company || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        a.source === "online"
                          ? "bg-blue-50 text-blue-700"
                          : a.source === "manual"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-charcoal-100 text-charcoal-600"
                      }`}>
                        {a.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-50 text-gold-700">
                          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full"></span>
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-charcoal-100">
            <p className="text-sm text-charcoal-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-charcoal-200 rounded-lg disabled:opacity-40 hover:bg-charcoal-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-charcoal-200 rounded-lg disabled:opacity-40 hover:bg-charcoal-50"
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
