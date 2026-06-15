import { supabase } from "@/lib/supabase";
import type { ActionType } from "@/features/action-execution/types";
import type { FailureCategory, ExecutionTrace } from "../types";

type TraceHandle = {
  executionId: string;
  fingerprint:  string;
  actionType:   ActionType;
  startedAt:    string;
};

export const executionTraceCollector = {
  start(executionId: string, fingerprint: string, actionType: ActionType): TraceHandle {
    return { executionId, fingerprint, actionType, startedAt: new Date().toISOString() };
  },

  async finish(handle: TraceHandle): Promise<void> {
    await flush(handle, "success", null);
  },

  async fail(handle: TraceHandle, category: FailureCategory): Promise<void> {
    await flush(handle, "failed", category);
  },
};

async function flush(
  handle:          TraceHandle,
  status:          "success" | "failed",
  failureCategory: FailureCategory | null,
): Promise<void> {
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - new Date(handle.startedAt).getTime();
  try {
    await supabase.from("execution_traces").insert({
      execution_id:     handle.executionId,
      fingerprint:      handle.fingerprint,
      action_type:      handle.actionType,
      status,
      failure_category: failureCategory,
      started_at:       handle.startedAt,
      finished_at:      finishedAt,
      duration_ms:      durationMs,
      created_at:       new Date().toISOString(),
    });
  } catch {
    // Trace writes are best-effort — never fail the caller
  }
}
