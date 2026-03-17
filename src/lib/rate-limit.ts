const rateMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const PLAN_LIMITS: Record<string, RateLimitConfig> = {
  free: { windowMs: 60_000, maxRequests: 2 },
  pro: { windowMs: 60_000, maxRequests: 10 },
  agency: { windowMs: 60_000, maxRequests: 30 },
  anonymous: { windowMs: 60_000, maxRequests: 5 },
};

export function checkRateLimit(
  key: string,
  plan: string = "anonymous"
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = PLAN_LIMITS[plan] || PLAN_LIMITS.anonymous;
  const now = Date.now();

  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetAt - now };
}

// Cleanup stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(key);
    }
  }, 60_000);
}
