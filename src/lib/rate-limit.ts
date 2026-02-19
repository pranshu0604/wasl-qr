type Store = Map<string, { count: number; resetAt: number }>;

const stores = new Map<string, Store>();

function limiter(
  namespace: string,
  maxRequests: number,
  windowMs: number
): (ip: string) => boolean {
  return (ip: string): boolean => {
    if (!stores.has(namespace)) stores.set(namespace, new Map());
    const store = stores.get(namespace)!;
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return false;
    }

    entry.count++;
    return entry.count > maxRequests;
  };
}

// 5 registrations per minute per IP
export const isRateLimited = limiter("register", 5, 60_000);

// 10 auth attempts per 15 minutes per IP (brute-force protection)
export const isAuthRateLimited = limiter("auth", 10, 15 * 60_000);

// 30 searches per minute per IP (kiosk debounces at 300 ms, this is generous)
export const isSearchRateLimited = limiter("search", 30, 60_000);

// Purge stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, val] of store) {
        if (now > val.resetAt) store.delete(key);
      }
    }
  }, 5 * 60_000);
}
