import { globalTraceCollector } from "@/features/intelligence-control-plane/tracing/globalTraceCollector";

const FAILURE_THRESHOLD = 0.4;   // >40% failure events in recent chain = anomaly
const LOOP_DEPTH        = 3;     // same module appearing >3× in one chain = loop

/** Detect failure propagation chains and execution loops for a user. */
export function detectTraceAnomaly(userId: string): number {
  const events = globalTraceCollector.forUser(userId);
  if (!events.length) return 0;

  // Recent 50 events
  const recent  = events.slice(-50);
  const failures = recent.filter((e) => e.type.endsWith("_failed")).length;
  const failureRate = failures / recent.length;

  // Cross-module loop: count max same-module appearances in a 10-event window
  let maxModuleRepeat = 0;
  for (let i = 0; i <= recent.length - 10; i++) {
    const window = recent.slice(i, i + 10);
    const moduleCounts = new Map<string, number>();
    for (const e of window) moduleCounts.set(e.module, (moduleCounts.get(e.module) ?? 0) + 1);
    const max = Math.max(...moduleCounts.values());
    if (max > maxModuleRepeat) maxModuleRepeat = max;
  }

  const failureScore = failureRate >= FAILURE_THRESHOLD
    ? Math.min(1, (failureRate - FAILURE_THRESHOLD) / (1 - FAILURE_THRESHOLD))
    : 0;
  const loopScore = maxModuleRepeat > LOOP_DEPTH
    ? Math.min(1, (maxModuleRepeat - LOOP_DEPTH) / LOOP_DEPTH)
    : 0;

  return Math.max(failureScore, loopScore);
}
