import type { DashboardEvent, TimeWindow } from "../types";
import { toBucket } from "../utils/timeWindowUtils";

export type TimelineBucket = {
  bucket:    string;   // ISO timestamp of bucket start
  events:    DashboardEvent[];
  count:     number;
  errors:    number;
};

/**
 * Group events into pre-aggregated time buckets.
 * Returns buckets sorted oldest-first for chart rendering.
 * Pure function — no I/O.
 */
export function buildTimeline(events: DashboardEvent[], window: TimeWindow): TimelineBucket[] {
  const buckets = new Map<string, TimelineBucket>();

  for (const e of events) {
    const key = toBucket(new Date(e.timestamp).getTime(), window);
    const bucket = buckets.get(key) ?? { bucket: key, events: [], count: 0, errors: 0 };
    bucket.events.push(e);
    bucket.count++;
    if (e.severity === "error" || e.severity === "critical") bucket.errors++;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort(
    (a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime(),
  );
}
