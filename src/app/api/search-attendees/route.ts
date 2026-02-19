import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { isSearchRateLimited } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isSearchRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.trim().length < 2) {
      return NextResponse.json({ attendees: [] });
    }

    const parts = q.trim().split(/\s+/);
    const mode = Prisma.QueryMode.insensitive;

    const orConditions: Prisma.AttendeeWhereInput[] = [
      { firstName: { contains: q, mode } },
      { lastName: { contains: q, mode } },
    ];

    if (parts.length >= 2) {
      orConditions.push({
        AND: [
          { firstName: { contains: parts[0], mode } },
          { lastName: { contains: parts[1], mode } },
        ],
      });
    }

    const attendees = await prisma.attendee.findMany({
      where: { OR: orConditions },
      orderBy: [
        { checkedIn: "asc" }, // not checked-in first
        { firstName: "asc" },
      ],
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        designation: true,
        checkedIn: true,
        checkedInAt: true,
      },
    });

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
