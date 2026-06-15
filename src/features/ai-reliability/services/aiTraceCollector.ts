import { supabase } from "@/lib/supabase";
import type { AITaskType } from "@/features/ai-processing/types";
import type { AITrace, AIFailureCategory } from "../types";

export function startTrace(jobId: string, fingerprint: string, taskType: AITaskType): AITrace {
  return {
    jobId, fingerprint, taskType,
    startedAt:       new Date().toISOString(),
    finishedAt:      null,
    durationMs:      null,
    status:          "running",
    failureCategory: null,
    tokenEstimate:   null,
    costEstimate:    null,
  };
}

export function completeTrace(trace: AITrace, tokenEstimate?: number, costEstimate?: number): AITrace {
  return {
    ...trace,
    finishedAt:    new Date().toISOString(),
    durationMs:    Date.now() - new Date(trace.startedAt).getTime(),
    status:        "completed",
    tokenEstimate: tokenEstimate ?? null,
    costEstimate:  costEstimate ?? null,
  };
}

export function failTrace(trace: AITrace, category: AIFailureCategory): AITrace {
  return {
    ...trace,
    finishedAt:      new Date().toISOString(),
    durationMs:      Date.now() - new Date(trace.startedAt).getTime(),
    status:          "failed",
    failureCategory: category,
  };
}

/** Best-effort flush — never throws. */
export async function flushTraces(traces: AITrace[]): Promise<void> {
  if (!traces.length) return;
  try {
    await supabase.from("ai_traces").insert(
      traces.map((t) => ({
        job_id:           t.jobId,
        fingerprint:      t.fingerprint,
        task_type:        t.taskType,
        started_at:       t.startedAt,
        finished_at:      t.finishedAt,
        duration_ms:      t.durationMs,
        status:           t.status,
        failure_category: t.failureCategory,
        token_estimate:   t.tokenEstimate,
        cost_estimate:    t.costEstimate,
      })),
    );
  } catch { /* best-effort */ }
}
