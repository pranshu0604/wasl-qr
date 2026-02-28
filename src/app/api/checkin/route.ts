import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { qrToken } = await req.json();

    if (!qrToken) {
      return NextResponse.json(
        { error: "QR token is required" },
        { status: 400 }
      );
    }

    const attendee = await db.findByQrToken(qrToken);

    if (!attendee) {
      return NextResponse.json(
        { found: false, error: "Visitor not found. Please use manual entry." },
        { status: 404 }
      );
    }

    if (attendee.checkedIn) {
      return NextResponse.json({
        found: true,
        alreadyCheckedIn: true,
        attendee: {
          id: attendee.id,
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          email: attendee.email,
          checkedInAt: attendee.checkedInAt,
        },
        message: `${attendee.firstName} ${attendee.lastName} has already checked in.`,
      });
    }

    const updated = await db.update(attendee.id, {
      checkedIn: true,
      checkedInAt: new Date(),
    });

    return NextResponse.json({
      found: true,
      alreadyCheckedIn: false,
      attendee: {
        id: updated!.id,
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        email: updated!.email,
        company: updated!.company,
        designation: updated!.designation,
      },
      message: `Welcome, ${updated!.firstName} ${updated!.lastName}!`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Check-in failed. Please try again." },
      { status: 500 }
    );
  }
}
