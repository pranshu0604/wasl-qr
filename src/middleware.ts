import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

// Fail closed: if ADMIN_CREDENTIALS is not set, no password is valid.
// Collect all valid passwords from "email:password" pairs for session verification.
const ADMIN_PASSWORDS = new Set(
  (process.env.ADMIN_CREDENTIALS ?? "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      return idx === -1 ? null : pair.slice(idx + 1);
    })
    .filter((v): v is string => v !== null)
);

async function isValidAdminSession(req: NextRequest): Promise<boolean> {
  // Browser sessions: verify the HMAC-signed cookie (never stores raw password)
  const cookie = req.cookies.get("admin_session")?.value;
  if (cookie) {
    try {
      const secret = await verifySessionToken(cookie);
      if (secret && ADMIN_PASSWORDS.has(secret)) return true;
    } catch {
      // SESSION_SECRET not configured or token tampered — deny
    }
  }

  // Script / API access: accept raw secret via header (for CLI tools / scripts)
  const header = req.headers.get("x-admin-secret");
  if (header && ADMIN_PASSWORDS.has(header)) return true;

  return false;
}

const PROTECTED_API_ROUTES = [
  "/api/attendees",
  "/api/attendee",
  "/api/checkin",
  "/api/import",
  "/api/manual-entry",
  "/api/resend-qr",
  "/api/toggle-checkin",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin UI pages
  if (pathname.startsWith("/admin")) {
    if (!(await isValidAdminSession(req))) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Protect admin API routes
  if (PROTECTED_API_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!(await isValidAdminSession(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/attendees/:path*",
    "/api/attendee/:path*",
    "/api/checkin/:path*",
    "/api/import/:path*",
    "/api/manual-entry/:path*",
    "/api/resend-qr",
    "/api/toggle-checkin",
  ],
};
