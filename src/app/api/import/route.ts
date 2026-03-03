import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidEmail, isWaslEmail, sanitize } from "@/lib/validate";

const MAX_IMPORT_SIZE = 500;

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

    if (attendees.length > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { error: `Import limited to ${MAX_IMPORT_SIZE} records at a time.` },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of attendees) {
      try {
        const { firstName, lastName, email, phone, company, designation } = entry;

        if (!firstName || !lastName || !email) {
          errors.push(`Skipped: Missing required fields for ${email || "unknown"}`);
          skipped++;
          continue;
        }

        if (!isValidEmail(email)) {
          errors.push(`Skipped: Invalid email ${email}`);
          skipped++;
          continue;
        }

        if (!isWaslEmail(email)) {
          errors.push(`Skipped: Email not from allowed domain ${email}`);
          skipped++;
          continue;
        }

        const existing = await db.findByEmail(email.toLowerCase().trim());

        if (existing) {
          skipped++;
          continue;
        }

        await db.create({
          firstName: sanitize(firstName),
          lastName: sanitize(lastName),
          email: email.toLowerCase().trim(),
          phone: phone ? sanitize(String(phone)) : null,
          company: company ? sanitize(company) : null,
          designation: designation ? sanitize(designation) : null,
          source: "import",
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
      errors: errors.slice(0, 20),
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
