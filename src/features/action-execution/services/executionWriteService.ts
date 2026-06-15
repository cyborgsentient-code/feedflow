import { supabase } from "@/lib/supabase";
import type { ExecutionResult, ExecutionServiceResult } from "../types";
import { mapError } from "./executionErrors";

function rowToResult(r: Record<string, unknown>): ExecutionResult {
  return {
    id:                String(r.id),
    automationEventId: String(r.automation_event_id),
    userId:            String(r.user_id),
    actionType:        r.action_type as ExecutionResult["actionType"],
    fingerprint:       String(r.fingerprint),
    status:            r.status as ExecutionResult["status"],
    resultPayload:     (r.result_payload as Record<string, unknown>) ?? {},
    createdAt:         String(r.created_at),
    completedAt:       r.completed_at ? String(r.completed_at) : null,
  };
}

export const executionWriteService = {
  async saveExecutionResult(
    result: Omit<ExecutionResult, "id" | "createdAt" | "completedAt">,
  ): Promise<ExecutionServiceResult<ExecutionResult>> {
    try {
      const { data, error } = await supabase
        .from("execution_results")
        .upsert(
          {
            automation_event_id: result.automationEventId,
            user_id:             result.userId,
            action_type:         result.actionType,
            fingerprint:         result.fingerprint,
            status:              result.status,
            result_payload:      result.resultPayload,
          },
          { onConflict: "fingerprint" },
        )
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: rowToResult(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async updateExecutionStatus(
    fingerprint: string,
    userId:      string,
    status:      ExecutionResult["status"],
    resultPayload?: Record<string, unknown>,
  ): Promise<ExecutionServiceResult> {
    try {
      const patch: Record<string, unknown> = { status };
      if (status === "completed" || status === "failed") patch.completed_at = new Date().toISOString();
      if (resultPayload) patch.result_payload = resultPayload;

      const { error } = await supabase
        .from("execution_results")
        .update(patch)
        .eq("fingerprint", fingerprint)
        .eq("user_id", userId);
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
