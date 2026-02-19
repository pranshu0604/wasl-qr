import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;

  // If no secret configured, allow access
  if (!ADMIN_SECRET) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { secret } = await req.json();

    if (secret === ADMIN_SECRET) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("admin_secret", secret, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return res;
    }

    return NextResponse.json({ ok: false, error: "Invalid password." }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
}
