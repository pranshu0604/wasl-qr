import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Attendee ID required" }, { status: 400 });

    const attendee = await prisma.attendee.findUnique({ where: { id } });
    if (!attendee) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });

    const updated = await prisma.attendee.update({
      where: { id },
      data: {
        checkedIn: !attendee.checkedIn,
        checkedInAt: !attendee.checkedIn ? new Date() : null,
      },
    });

    return NextResponse.json({ checkedIn: updated.checkedIn, checkedInAt: updated.checkedInAt });
  } catch (error) {
    console.error("Toggle check-in error:", error);
    return NextResponse.json({ error: "Failed to update check-in status" }, { status: 500 });
  }
}
