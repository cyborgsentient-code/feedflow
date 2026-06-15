import type { ProfileTrace } from "../types";

const traces: ProfileTrace[] = [];
const startTimes = new Map<string, number>();

function traceId(userId: string): string {
  return `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const profileTraceCollector = {
  startProfileBuild(userId: string): string {
    const id = traceId(userId);
    startTimes.set(id, Date.now());
    traces.push({ traceId: id, userId, phase: "start", timestamp: new Date().toISOString() });
    return id;
  },

  finishProfileBuild(id: string): void {
    const start = startTimes.get(id);
    const trace = traces.find((t) => t.traceId === id && t.phase === "start");
    if (!trace) return;
    traces.push({
      traceId:    id,
      userId:     trace.userId,
      phase:      "finish",
      durationMs: start ? Date.now() - start : undefined,
      timestamp:  new Date().toISOString(),
    });
    startTimes.delete(id);
  },

  failProfileBuild(id: string, error: string): void {
    const trace = traces.find((t) => t.traceId === id && t.phase === "start");
    if (!trace) return;
    traces.push({
      traceId:   id,
      userId:    trace.userId,
      phase:     "fail",
      error,
      timestamp: new Date().toISOString(),
    });
    startTimes.delete(id);
  },

  /** Returns last N traces for inspection (dev/debug use). */
  recent(n = 20): ProfileTrace[] {
    return traces.slice(-n);
  },
};
