import type { JobTrace } from "../types";

// In-memory trace store — flushed to DB by the Edge Function after each batch.
// Client reads traces via traceCollector.getRecent() for admin display.
const traces: Map<string, JobTrace> = new Map();

export const traceCollector = {
  start(params: Omit<JobTrace, "endTime" | "durationMs" | "status" | "failureCategory">): JobTrace {
    const trace: JobTrace = { ...params, endTime: null, durationMs: null, status: "running", failureCategory: null };
    traces.set(trace.traceId, trace);
    return trace;
  },

  finish(traceId: string, status: "success" | "failed", failureCategory: JobTrace["failureCategory"] = null): JobTrace | null {
    const trace = traces.get(traceId);
    if (!trace) return null;
    trace.endTime        = new Date().toISOString();
    trace.durationMs     = Date.now() - new Date(trace.startTime).getTime();
    trace.status         = status;
    trace.failureCategory = failureCategory;
    return trace;
  },

  getRecent(limit = 50): JobTrace[] {
    return [...traces.values()]
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
      .slice(0, limit);
  },

  /** Drain completed traces for DB persistence (called by Edge Function). */
  drain(): JobTrace[] {
    const done = [...traces.values()].filter((t) => t.status !== "running");
    done.forEach((t) => traces.delete(t.traceId));
    return done;
  },
};
