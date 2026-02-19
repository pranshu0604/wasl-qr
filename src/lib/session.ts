import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is required");
  return s;
}

/**
 * Creates an HMAC-signed session token that encodes the admin secret.
 * Cookie value is never the raw password — only this signed token.
 */
export function createSessionToken(adminSecret: string): string {
  const secret = getSecret();
  // payload = base64url(adminSecret):timestamp
  const payload =
    Buffer.from(adminSecret).toString("base64url") + ":" + Date.now();
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + sig;
}

/**
 * Verifies a session token and returns the embedded admin secret, or null if invalid.
 */
export function verifySessionToken(token: string): string | null {
  try {
    const secret = getSecret();
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");
    // Constant-time comparison to prevent timing attacks
    const aBuf = Buffer.from(sig, "utf8");
    const bBuf = Buffer.from(expected, "utf8");
    if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf))
      return null;
    const colonIdx = payload.indexOf(":");
    if (colonIdx === -1) return null;
    return Buffer.from(payload.slice(0, colonIdx), "base64url").toString();
  } catch {
    return null;
  }
}
