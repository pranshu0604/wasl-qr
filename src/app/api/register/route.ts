import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendQREmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, company, designation } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "First name, last name, email, and phone are required." },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await prisma.attendee.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      // Resend QR email for existing registration
      try {
        await sendQREmail({
          to: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          qrToken: existing.qrToken,
        });
      } catch (emailErr) {
        console.error("Email resend error:", emailErr);
      }

      return NextResponse.json(
        { error: "This email is already registered. We've resent your QR pass to your email." },
        { status: 409 }
      );
    }

    // Create attendee
    const attendee = await prisma.attendee.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        company: company?.trim() || null,
        designation: designation?.trim() || null,
        source: "online",
      },
    });

    // Send QR email
    try {
      await sendQREmail({
        to: attendee.email,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        qrToken: attendee.qrToken,
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Registration succeeded even if email fails — they can get it resent
    }

    return NextResponse.json({
      id: attendee.id,
      message: "Registration successful. QR pass sent to your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
