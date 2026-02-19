import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "yatharth";

const PROTECTED_API_ROUTES = ["/api/attendees", "/api/checkin", "/api/import", "/api/manual-entry"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin pages — always require admin_secret cookie
  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get("admin_secret")?.value;
    if (cookie !== ADMIN_SECRET) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect admin API routes — require admin_secret cookie or x-admin-secret header
  if (PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r))) {
    const cookie = req.cookies.get("admin_secret")?.value;
    const header = req.headers.get("x-admin-secret");

    if (cookie !== ADMIN_SECRET && header !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/attendees/:path*", "/api/checkin/:path*", "/api/import/:path*", "/api/manual-entry/:path*"],
};
