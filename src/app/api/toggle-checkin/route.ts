import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Attendee ID required" }, { status: 400 });

    // Serializable transaction eliminates the TOCTOU race between reading
    // checkedIn and writing the toggled value under concurrent requests.
    const updated = await prisma.$transaction(
      async (tx) => {
        const current = await tx.attendee.findUnique({
          where: { id },
          select: { checkedIn: true },
        });
        if (!current) return null;
        return tx.attendee.update({
          where: { id },
          data: {
            checkedIn: !current.checkedIn,
            checkedInAt: !current.checkedIn ? new Date() : null,
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    if (!updated) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });

    return NextResponse.json({ checkedIn: updated.checkedIn, checkedInAt: updated.checkedInAt });
  } catch (error) {
    console.error("Toggle check-in error:", error);
    return NextResponse.json({ error: "Failed to update check-in status" }, { status: 500 });
  }
}
