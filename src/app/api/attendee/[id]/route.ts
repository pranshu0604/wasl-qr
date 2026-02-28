import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attendee = await db.findById(id);

    if (!attendee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      email: attendee.email,
    });
  } catch (error) {
    console.error("Attendee fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendee" }, { status: 500 });
  }
}
