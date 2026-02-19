import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attendee = await db.attendee.findUnique({
    where: { id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      qrToken: true,
    },
  });

  if (!attendee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(attendee);
}
