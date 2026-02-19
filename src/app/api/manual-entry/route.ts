import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    const phone = sanitize(body.phone);
    const company = body.company ? sanitize(body.company) : null;
    const designation = body.designation ? sanitize(body.designation) : null;

    // Atomic upsert — eliminates the race condition between the old
    // findUnique check and create (which could cause P2002 under concurrent requests)
    const isNew = !(await prisma.attendee.findUnique({ where: { email }, select: { id: true } }));
    const attendee = await prisma.attendee.upsert({
      where: { email },
      update: { checkedIn: true, checkedInAt: new Date() },
      create: {
        firstName, lastName, email, phone, company, designation,
        source: "manual", checkedIn: true, checkedInAt: new Date(),
      },
    });

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
