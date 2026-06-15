/** Convert milliseconds timestamp to ISO string bucket of given window. */
export function toBucket(tsMs: number, window: "1m" | "5m" | "1h" | "24h" | "7d"): string {
  const widths: Record<string, number> = {
    "1m":  60_000,
    "5m":  300_000,
    "1h":  3_600_000,
    "24h": 86_400_000,
    "7d":  604_800_000,
  };
  const width = widths[window] ?? 60_000;
  return new Date(Math.floor(tsMs / width) * width).toISOString();
}

export function windowToMs(window: "1m" | "5m" | "1h" | "24h" | "7d"): number {
  const map: Record<string, number> = {
    "1m":  60_000,
    "5m":  300_000,
    "1h":  3_600_000,
    "24h": 86_400_000,
    "7d":  604_800_000,
  };
  return map[window] ?? 60_000;
}

export function windowStart(window: "1m" | "5m" | "1h" | "24h" | "7d"): string {
  return new Date(Date.now() - windowToMs(window)).toISOString();
}
