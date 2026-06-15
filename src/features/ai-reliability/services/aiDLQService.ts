import { supabase } from "@/lib/supabase";
import type { AITaskType } from "@/features/ai-processing/types";
import type { AIDLQEntry, AIFailureCategory } from "../types";

export const aiDLQService = {
  async writeDLQEntry(entry: Omit<AIDLQEntry, "createdAt">): Promise<void> {
    try {
      await supabase.from("ai_dlq").upsert(
        {
          job_id:           entry.jobId,
          fingerprint:      entry.fingerprint,
          user_id:          entry.userId,
          task_type:        entry.taskType,
          failure_category: entry.failureCategory,
          error_message:    entry.errorMessage,
          retry_count:      entry.retryCount,
          created_at:       new Date().toISOString(),
        },
        { onConflict: "fingerprint" },
      );
    } catch { /* DLQ writes never fail the caller */ }
  },

  async getDLQEntries(userId: string): Promise<AIDLQEntry[]> {
    const { data } = await supabase
      .from("ai_dlq")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(rowToEntry);
  },

  async getDLQEntry(fingerprint: string, userId: string): Promise<AIDLQEntry | null> {
    const { data } = await supabase
      .from("ai_dlq")
      .select("*")
      .eq("fingerprint", fingerprint)
      .eq("user_id", userId)
      .maybeSingle();
    return data ? rowToEntry(data as Record<string, unknown>) : null;
  },
};

function rowToEntry(r: Record<string, unknown>): AIDLQEntry {
  return {
    jobId:           String(r.job_id),
    fingerprint:     String(r.fingerprint),
    userId:          String(r.user_id),
    taskType:        r.task_type as AITaskType,
    failureCategory: r.failure_category as AIFailureCategory,
    errorMessage:    String(r.error_message),
    retryCount:      Number(r.retry_count),
    createdAt:       String(r.created_at),
  };
}
