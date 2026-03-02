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

  console.log("[AUTH] POST /api/auth from IP:", ip);
  console.log("[AUTH] ADMIN_CREDS has", ADMIN_CREDS.size, "entries:", [...ADMIN_CREDS.keys()]);
  console.log("[AUTH] SESSION_SECRET set:", !!process.env.SESSION_SECRET);

  if (isAuthRateLimited(ip)) {
    console.log("[AUTH] Rate limited IP:", ip);
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    console.log("[AUTH] Request body keys:", Object.keys(body));
    const { email, secret } = body;

    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    const expectedPassword = ADMIN_CREDS.get(normalizedEmail);

    console.log("[AUTH] Email:", normalizedEmail, "| Found in creds:", !!expectedPassword);

    if (expectedPassword && typeof secret === "string" && secret === expectedPassword) {
      console.log("[AUTH] Credentials valid, creating session token...");
      const sessionToken = await createSessionToken(expectedPassword);
      console.log("[AUTH] Session token created, length:", sessionToken.length);
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

    console.log("[AUTH] Invalid credentials for email:", normalizedEmail);
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (err) {
    console.error("[AUTH] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }
}
