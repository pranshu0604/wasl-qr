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

    // Check if already exists
    const existing = await prisma.attendee.findUnique({
      where: { email },
    });

    if (existing) {
      // Check them in if not already
      if (!existing.checkedIn) {
        await prisma.attendee.update({
          where: { id: existing.id },
          data: { checkedIn: true, checkedInAt: new Date() },
        });
      }

      return NextResponse.json({
        id: existing.id,
        alreadyExists: true,
        message: `${existing.firstName} ${existing.lastName} found and checked in.`,
      });
    }

    // Create new attendee with manual source and auto check-in
    const attendee = await prisma.attendee.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        designation,
        source: "manual",
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });

    return NextResponse.json({
      id: attendee.id,
      alreadyExists: false,
      message: `${attendee.firstName} ${attendee.lastName} registered and checked in.`,
    });
  } catch (error) {
    console.error("Manual entry error:", error);
    return NextResponse.json(
      { error: "Manual entry failed. Please try again." },
      { status: 500 }
    );
  }
}
