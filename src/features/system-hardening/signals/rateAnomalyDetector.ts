/** Sliding-window counter per key. */
const windows = new Map<string, { count: number; windowStart: number }>();

const THRESHOLDS = { "10s": { ms: 10_000, limit: 20 }, "60s": { ms: 60_000, limit: 80 }, "5m": { ms: 300_000, limit: 300 } } as const;

function count(key: string, windowMs: number): number {
  const e = windows.get(`${key}:${windowMs}`);
  if (!e || Date.now() - e.windowStart > windowMs) return 0;
  return e.count;
}

function increment(key: string, windowMs: number): void {
  const k = `${key}:${windowMs}`;
  const e = windows.get(k);
  if (!e || Date.now() - e.windowStart > windowMs) windows.set(k, { count: 1, windowStart: Date.now() });
  else e.count++;
}

/**
 * Returns [0,1] burst score: 0 = normal, 1 = fully anomalous.
 * Checks across 10s, 60s, 5m windows and takes the worst.
 */
export function detectRateAnomaly(userId: string, module: string, action: string): number {
  const key = `${userId}:${module}:${action}`;
  const scores = Object.values(THRESHOLDS).map(({ ms, limit }) => {
    increment(key, ms);
    return Math.min(1, count(key, ms) / limit);
  });
  return Math.max(...scores);
}
