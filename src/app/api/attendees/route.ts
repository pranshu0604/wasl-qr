import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = (searchParams.get("filter") || "all") as "all" | "checked-in" | "not-checked-in";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50));
    const skip = (page - 1) * limit;

    const [attendees, total, checkedInCount, totalAll] = await Promise.all([
      db.findMany({ search: search.slice(0, 100), filter, skip, take: limit }),
      db.findMany({ search: search.slice(0, 100), filter }).then((r) => r.length),
      db.count("checked-in"),
      db.count(),
    ]);

    return NextResponse.json({
      attendees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: totalAll,
        checkedIn: checkedInCount,
        pending: totalAll - checkedInCount,
      },
    });
  } catch (error) {
    console.error("Attendees fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendees" },
      { status: 500 }
    );
  }
}
