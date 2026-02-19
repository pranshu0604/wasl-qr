import { NextRequest, NextResponse } from "next/server";
import { isAuthRateLimited } from "@/lib/rate-limit";
import { createSessionToken } from "@/lib/session";

// Fail closed: no fallback defaults — misconfiguration means no admin access.
const ADMIN_PASSWORDS = new Set(
  (process.env.ADMIN_SECRETS ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
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
    const { secret } = await req.json();

    if (typeof secret === "string" && ADMIN_PASSWORDS.has(secret)) {
      // Store a signed session token — never the raw password
      const sessionToken = createSessionToken(secret);
      const res = NextResponse.json({ ok: true });
      res.cookies.set("admin_session", sessionToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      // Clear any old raw-password cookie from previous sessions
      res.cookies.delete("admin_secret");
      return res;
    }

    return NextResponse.json(
      { ok: false, error: "Invalid password." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}
