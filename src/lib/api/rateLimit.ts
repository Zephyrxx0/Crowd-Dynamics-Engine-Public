interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Note: this bucket resets on serverless cold start — per-process limit only.
// For production with multiple instances, replace with Redis-backed rate limiter (e.g., @upstash/ratelimit).
const buckets = new Map<string, TokenBucket>();

export function rateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);
  
  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(ip, bucket);
  }

  const timePassed = now - bucket.lastRefill;
  const refillRate = limit / windowMs;
  const tokensToAdd = timePassed * refillRate;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}
