import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateRegistration, sanitize } from "@/lib/validate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationError = validateRegistration(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const firstName = sanitize(body.firstName);
    const lastName = sanitize(body.lastName);
    const email = body.email.toLowerCase().trim();
    const phone = body.phone ? sanitize(body.phone) : null;
    const company = body.company ? sanitize(body.company) : null;
    const designation = body.designation ? sanitize(body.designation) : null;

    const { attendee, isNew } = await db.upsert(
      email,
      {
        firstName, lastName, email, phone, company, designation,
        source: "manual", checkedIn: true, checkedInAt: new Date(),
      },
      { checkedIn: true, checkedInAt: new Date() }
    );

    return NextResponse.json({
      id: attendee.id,
      alreadyExists: !isNew,
      message: `${attendee.firstName} ${attendee.lastName} ${isNew ? "registered and" : "found and"} checked in.`,
    });
  } catch (error) {
    console.error("Manual entry error:", error);
    return NextResponse.json(
      { error: "Manual entry failed. Please try again." },
      { status: 500 }
    );
  }
}
