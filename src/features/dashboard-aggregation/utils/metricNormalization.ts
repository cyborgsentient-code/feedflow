/** Clamp value to [0, 1]. */
export function normalize(value: number, max: number): number {
  return max > 0 ? Math.min(1, value / max) : 0;
}

/** Rate from 0–1 given success and total count. */
export function successRate(success: number, total: number): number {
  return total > 0 ? success / total : 1;
}

/** Round to 2 decimal places. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
