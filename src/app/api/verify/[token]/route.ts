import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const attendee = await prisma.attendee.findUnique({
      where: { qrToken: token },
    });

    if (!attendee) {
      return NextResponse.json(
        { valid: false, error: "Attendee not found" },
        { status: 404 }
      );
    }

    // Email and phone intentionally omitted — endpoint is public (token in QR URL)
    return NextResponse.json({
      valid: true,
      attendee: {
        id: attendee.id,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        company: attendee.company,
        designation: attendee.designation,
        checkedIn: attendee.checkedIn,
        checkedInAt: attendee.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { valid: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
