import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, designation } = body;

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "First name, last name, email, and phone are required." },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.attendee.findUnique({
      where: { email: email.toLowerCase().trim() },
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        company: company?.trim() || null,
        designation: designation?.trim() || null,
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
