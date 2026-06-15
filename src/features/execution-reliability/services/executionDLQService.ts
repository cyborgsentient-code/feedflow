import { supabase } from "@/lib/supabase";
import type { ActionType } from "@/features/action-execution/types";
import type { FailureCategory, ExecutionDLQEntry } from "../types";

export const executionDLQService = {
  async writeToDLQ(params: {
    fingerprint:     string;
    executionId:     string;
    actionType:      ActionType;
    userId:          string;
    failureCategory: FailureCategory;
    errorMessage:    string;
    retryCount:      number;
  }): Promise<void> {
    await supabase.from("execution_dlq").upsert(
      {
        fingerprint:      params.fingerprint,
        execution_id:     params.executionId,
        action_type:      params.actionType,
        user_id:          params.userId,
        failure_category: params.failureCategory,
        error_message:    params.errorMessage,
        retry_count:      params.retryCount,
        created_at:       new Date().toISOString(),
      },
      { onConflict: "fingerprint" },
    );
    // DLQ write failures are swallowed — execution result already persisted
  },

  async getDLQEntries(userId: string): Promise<ExecutionDLQEntry[]> {
    const { data } = await supabase
      .from("execution_dlq")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(rowToDLQEntry);
  },

  async getDLQEntry(fingerprint: string, userId: string): Promise<ExecutionDLQEntry | null> {
    const { data } = await supabase
      .from("execution_dlq")
      .select("*")
      .eq("fingerprint", fingerprint)
      .eq("user_id", userId)
      .maybeSingle();
    return data ? rowToDLQEntry(data as Record<string, unknown>) : null;
  },
};

function rowToDLQEntry(r: Record<string, unknown>): ExecutionDLQEntry {
  return {
    id:              String(r.id),
    fingerprint:     String(r.fingerprint),
    executionId:     String(r.execution_id),
    actionType:      r.action_type as ActionType,
    userId:          String(r.user_id),
    failureCategory: r.failure_category as FailureCategory,
    errorMessage:    String(r.error_message),
    retryCount:      Number(r.retry_count),
    createdAt:       String(r.created_at),
  };
}
