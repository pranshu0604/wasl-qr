import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendQREmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Attendee ID required" }, { status: 400 });

    const attendee = await db.findById(id);
    if (!attendee) return NextResponse.json({ error: "Attendee not found" }, { status: 404 });

    await sendQREmail({
      to: attendee.email,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      qrToken: attendee.qrToken,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Resend QR error:", error);
    return NextResponse.json({ error: "Failed to resend email" }, { status: 500 });
  }
}
