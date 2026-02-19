import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50") || 50));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      // Cap search length to prevent abuse
      const q = search.slice(0, 100);
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { company: { contains: q, mode: "insensitive" } },
      ];
    }

    if (filter === "checked-in") {
      where.checkedIn = true;
    } else if (filter === "not-checked-in") {
      where.checkedIn = false;
    }

    const [attendees, total, checkedInCount] = await Promise.all([
      prisma.attendee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.attendee.count({ where }),
      prisma.attendee.count({ where: { checkedIn: true } }),
    ]);

    const totalAll = await prisma.attendee.count();

    return NextResponse.json({
      attendees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: totalAll,
        checkedIn: checkedInCount,
        pending: totalAll - checkedInCount,
      },
    });
  } catch (error) {
    console.error("Attendees fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendees" },
      { status: 500 }
    );
  }
}
