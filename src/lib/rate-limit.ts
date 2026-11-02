/**
 * A small in-memory sliding-window limiter. On serverless hosting each
 * instance keeps its own counts, so this is a best-effort brake against a
 * single visitor hammering an endpoint, not a hard global quota.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);

    // Keep memory bounded: forget keys that have gone quiet.
    if (hits.size > 5_000) {
      for (const [other, times] of hits) {
        if (times.every((time) => now - time >= windowMs)) {
          hits.delete(other);
        }
      }
    }
    return true;
  };
}
