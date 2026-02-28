import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { attendeeId } = await req.json();

    if (!attendeeId) {
      return NextResponse.json(
        { error: "Attendee ID is required" },
        { status: 400 }
      );
    }

    const attendee = await db.findById(attendeeId);

    if (!attendee) {
      return NextResponse.json(
        { error: "Attendee not found" },
        { status: 404 }
      );
    }

    if (attendee.checkedIn) {
      return NextResponse.json({
        alreadyCheckedIn: true,
        attendee: {
          firstName: attendee.firstName,
          lastName: attendee.lastName,
          company: attendee.company,
          checkedInAt: attendee.checkedInAt,
        },
        message: `${attendee.firstName}, you have already checked in.`,
      });
    }

    const updated = await db.update(attendeeId, {
      checkedIn: true,
      checkedInAt: new Date(),
    });

    return NextResponse.json({
      alreadyCheckedIn: false,
      attendee: {
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        company: updated!.company,
        designation: updated!.designation,
      },
      message: `Welcome, ${updated!.firstName}!`,
    });
  } catch (error) {
    console.error("Self check-in error:", error);
    return NextResponse.json(
      { error: "Check-in failed. Please try again." },
      { status: 500 }
    );
  }
}
