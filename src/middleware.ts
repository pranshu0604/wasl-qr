import { NextRequest, NextResponse } from "next/server";

// In production, ADMIN_SECRETS env var MUST be set in Vercel dashboard.
// In local dev it falls back to defaults so login still works.
const fallback = process.env.NODE_ENV === "production" ? "" : "yatharth,adwait";
const ADMIN_PASSWORDS = new Set(
  (process.env.ADMIN_SECRETS || fallback).split(",").map((p) => p.trim()).filter(Boolean)
);

const PROTECTED_API_ROUTES = [
  "/api/attendees", "/api/checkin", "/api/import", "/api/manual-entry",
  "/api/resend-qr", "/api/toggle-checkin",
  "/api/self-checkin", // kiosk no longer uses this — block unauthenticated callers
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin pages — always require admin_secret cookie
  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get("admin_secret")?.value;
    if (!cookie || !ADMIN_PASSWORDS.has(cookie)) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin API routes — require admin_secret cookie or x-admin-secret header
  if (PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const cookie = req.cookies.get("admin_secret")?.value;
    const header = req.headers.get("x-admin-secret");

    if ((!cookie || !ADMIN_PASSWORDS.has(cookie)) && (!header || !ADMIN_PASSWORDS.has(header))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/attendees/:path*", "/api/checkin/:path*", "/api/import/:path*",
    "/api/manual-entry/:path*", "/api/resend-qr", "/api/toggle-checkin",
    "/api/self-checkin",
  ],
};
