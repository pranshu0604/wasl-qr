import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendQREmail } from "@/lib/email";
import { validateRegistration, sanitize } from "@/lib/validate";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Validate all fields
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

    // Check if email already registered
    const existingByEmail = await prisma.attendee.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Resend QR email for existing registration
      try {
        await sendQREmail({
          to: existingByEmail.email,
          firstName: existingByEmail.firstName,
          lastName: existingByEmail.lastName,
          qrToken: existingByEmail.qrToken,
        });
      } catch (emailErr) {
        console.error("Email resend error:", emailErr);
      }

      return NextResponse.json(
        { error: "This email is already registered. We've resent your QR pass to your email." },
        { status: 409 }
      );
    }

    // Check if phone already registered
    const existingByPhone = await prisma.attendee.findFirst({
      where: { phone },
    });

    if (existingByPhone) {
      return NextResponse.json(
        { error: "This phone number is already registered. Please use a different number or contact support." },
        { status: 409 }
      );
    }

    // Create attendee
    const attendee = await prisma.attendee.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        designation,
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
