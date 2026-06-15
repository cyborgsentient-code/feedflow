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

export const executionReadService = {
  async getExecutionResult(id: string, userId: string): Promise<ExecutionServiceResult<ExecutionResult>> {
    try {
      const { data, error } = await supabase
        .from("execution_results")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return { success: true, data: rowToResult(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getExecutionByFingerprint(fingerprint: string, userId: string): Promise<ExecutionServiceResult<ExecutionResult>> {
    try {
      const { data, error } = await supabase
        .from("execution_results")
        .select("*")
        .eq("fingerprint", fingerprint)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { success: false, error: { code: "not_found", message: "Execution not found." } };
      return { success: true, data: rowToResult(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getUserExecutionResults(userId: string): Promise<ExecutionServiceResult<ExecutionResult[]>> {
    try {
      const { data, error } = await supabase
        .from("execution_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToResult(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
