const buckets = new Map<string, { tokens: number; resetAt: number }>();

export function rateLimit(ip: string, limitPerHour: number) {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { tokens: limitPerHour, resetAt: now + hour };
    buckets.set(ip, bucket);
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

