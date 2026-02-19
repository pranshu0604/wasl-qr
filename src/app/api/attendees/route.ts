import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, checked-in, not-checked-in
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { company: { contains: search, mode: "insensitive" } },
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
