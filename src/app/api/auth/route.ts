import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

const fallback = process.env.NODE_ENV === "production" ? "" : "yatharth,adwait";
const ADMIN_PASSWORDS = new Set(
  (process.env.ADMIN_SECRETS || fallback).split(",").map((p) => p.trim()).filter(Boolean)
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Wait a minute." }, { status: 429 });
  }

  try {
    const { secret } = await req.json();

    if (ADMIN_PASSWORDS.has(secret)) {
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
