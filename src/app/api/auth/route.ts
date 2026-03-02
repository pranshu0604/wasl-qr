import { NextRequest, NextResponse } from "next/server";
import { isAuthRateLimited } from "@/lib/rate-limit";
import { createSessionToken } from "@/lib/session";

// Parse "email:password" pairs from ADMIN_CREDENTIALS env var
// Fail closed: no fallback defaults — misconfiguration means no admin access.
const ADMIN_CREDS = new Map(
  (process.env.ADMIN_CREDENTIALS ?? "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx === -1) return null;
      return [pair.slice(0, idx).toLowerCase(), pair.slice(idx + 1)] as [string, string];
    })
    .filter((v): v is [string, string] => v !== null)
);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isAuthRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { email, secret } = await req.json();

    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const expectedPassword = ADMIN_CREDS.get(normalizedEmail);

    if (expectedPassword && typeof secret === "string" && secret === expectedPassword) {
      // Store a signed session token
      const sessionToken = await createSessionToken(expectedPassword);
      const res = NextResponse.json({ ok: true });
      res.cookies.set("admin_session", sessionToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      res.cookies.delete("admin_secret");
      return res;
    }

    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}
