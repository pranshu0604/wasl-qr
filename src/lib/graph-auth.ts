let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getGraphToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const tenantId = process.env.AZURE_TENANT_ID!;
  const clientId = process.env.AZURE_CLIENT_ID!;
  const clientSecret = process.env.AZURE_CLIENT_SECRET!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }).toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph token error: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Expire 5 minutes early to avoid edge cases
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return cachedToken!;
}
