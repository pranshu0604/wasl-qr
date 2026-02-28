import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Attendee ID required" }, { status: 400 });

    const current = await db.findById(id);
    if (!current) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });

    const updated = await db.update(id, {
      checkedIn: !current.checkedIn,
      checkedInAt: !current.checkedIn ? new Date() : null,
    });

    return NextResponse.json({ checkedIn: updated!.checkedIn, checkedInAt: updated!.checkedInAt });
  } catch (error) {
    console.error("Toggle check-in error:", error);
    return NextResponse.json({ error: "Failed to update check-in status" }, { status: 500 });
  }
}
