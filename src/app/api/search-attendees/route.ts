import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSearchRateLimited } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isSearchRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.trim().length < 2) {
      return NextResponse.json({ attendees: [] });
    }

    // Get all attendees matching the search
    const allMatches = await db.findMany({ search: q.trim() });

    // Apply the same multi-part matching and sorting as the original
    const parts = q.trim().split(/\s+/);
    let results = allMatches;

    // If multi-word search, also include first+last name combos
    if (parts.length >= 2) {
      const p0 = parts[0].toLowerCase();
      const p1 = parts[1].toLowerCase();
      // findMany already does basic search; add first+last combo matches
      const allAttendees = await db.findMany({});
      const combos = allAttendees.filter(
        (a) =>
          a.firstName.toLowerCase().includes(p0) &&
          a.lastName.toLowerCase().includes(p1)
      );
      // Merge, avoiding duplicates
      const ids = new Set(results.map((a) => a.id));
      for (const c of combos) {
        if (!ids.has(c.id)) results.push(c);
      }
    }

    // Sort: not checked-in first, then by firstName
    results.sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) return a.checkedIn ? 1 : -1;
      return a.firstName.localeCompare(b.firstName);
    });

    // Take top 8, select specific fields
    const attendees = results.slice(0, 8).map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      company: a.company,
      designation: a.designation,
      checkedIn: a.checkedIn,
      checkedInAt: a.checkedInAt,
    }));

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
