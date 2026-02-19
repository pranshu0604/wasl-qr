// Uses Web Crypto API only — compatible with both Edge Runtime and Node.js (>=18).
// Do NOT import Node.js "crypto" here; use the global `crypto.subtle` instead.

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is required");
  return s;
}

function toBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates an HMAC-signed session token encoding the admin secret.
 * Format: base64url(adminSecret):timestamp.hmac_sig
 */
export async function createSessionToken(adminSecret: string): Promise<string> {
  const secret = getSecret();
  const encodedSecret = btoa(adminSecret)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payload = encodedSecret + ":" + Date.now();
  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return payload + "." + toBase64url(sigBuffer);
}

/**
 * Verifies a session token and returns the embedded admin secret, or null if invalid/tampered.
 * Uses crypto.subtle.verify which is timing-safe.
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const secret = getSecret();
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const key = await getHmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64url(sig),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;
    const colonIdx = payload.indexOf(":");
    if (colonIdx === -1) return null;
    const encodedSecret = payload.slice(0, colonIdx);
    const base64 = encodedSecret.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}
