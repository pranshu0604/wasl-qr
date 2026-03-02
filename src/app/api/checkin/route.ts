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

    let result;
    try {
      result = await db.checkin(qrToken);
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_FOUND") {
        return NextResponse.json(
          { found: false, error: "Visitor not found. Please use manual entry." },
          { status: 404 }
        );
      }
      throw err;
    }

    const { attendee, alreadyCheckedIn } = result;

    if (alreadyCheckedIn) {
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

    return NextResponse.json({
      found: true,
      alreadyCheckedIn: false,
      attendee: {
        id: attendee.id,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        email: attendee.email,
        company: attendee.company,
        designation: attendee.designation,
      },
      message: `Welcome, ${attendee.firstName} ${attendee.lastName}!`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Check-in failed. Please try again." },
      { status: 500 }
    );
  }
}
