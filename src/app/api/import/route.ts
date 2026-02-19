import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attendees } = body;

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of attendees." },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of attendees) {
      try {
        const { firstName, lastName, email, phone, company, designation } = entry;

        if (!firstName || !lastName || !email || !phone) {
          errors.push(`Skipped: Missing required fields for ${email || "unknown"}`);
          skipped++;
          continue;
        }

        const existing = await prisma.attendee.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.attendee.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            phone: String(phone).trim(),
            company: company?.trim() || null,
            designation: designation?.trim() || null,
            source: "import",
          },
        });

        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Error for ${entry.email || "unknown"}: ${msg}`);
        skipped++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      total: attendees.length,
      errors: errors.slice(0, 20), // Return first 20 errors max
      message: `Imported ${imported} attendees. Skipped ${skipped}.`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed. Please check your data format." },
      { status: 500 }
    );
  }
}
