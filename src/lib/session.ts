// Uses Web Crypto API only — compatible with both Edge Runtime and Node.js (>=18).
// Uses TextEncoder/TextDecoder for base64 encoding — consistent across all runtimes.

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is required");
  return s;
}

function toBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
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

// Encode a UTF-8 string to base64url using TextEncoder (works in Edge + Node)
function stringToBase64url(str: string): string {
  return toBase64url(new TextEncoder().encode(str).buffer as ArrayBuffer);
}

// Decode a base64url string back to UTF-8 using TextDecoder (works in Edge + Node)
function base64urlToString(b64: string): string {
  return new TextDecoder().decode(fromBase64url(b64));
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
 * Format: base64url(adminSecret).timestamp.hmac_sig
 * Uses "." as separator throughout (no ":" which can conflict with base64).
 */
export async function createSessionToken(adminSecret: string): Promise<string> {
  const secret = getSecret();
  const encodedSecret = stringToBase64url(adminSecret);
  const payload = encodedSecret + "." + Date.now();
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
    // Token format: encodedSecret.timestamp.signature
    // Find the last "." to split off the signature
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
    // Split payload into encodedSecret and timestamp
    const dotIdx = payload.indexOf(".");
    if (dotIdx === -1) return null;
    const encodedSecret = payload.slice(0, dotIdx);
    return base64urlToString(encodedSecret);
  } catch {
    return null;
  }
}
