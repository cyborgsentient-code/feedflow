import { supabase } from "@/lib/supabase";
import type { DLQEntry, FailureCategory } from "../../automation-observability/types";

export type DLQFilter = {
  userId?:          string;
  failureCategory?: FailureCategory;
  limit?:           number;
};

export const dlqReader = {
  async getFailedJobs(filter: DLQFilter = {}): Promise<DLQEntry[]> {
    let q = supabase
      .from("automation_dlq")
      .select("*")
      .order("last_attempt_at", { ascending: false })
      .limit(filter.limit ?? 100);

    if (filter.userId)          q = q.eq("user_id", filter.userId);
    if (filter.failureCategory) q = q.eq("failure_category", filter.failureCategory);

    const { data } = await q;
    return (data ?? []).map((r) => ({
      fingerprint:       String(r.fingerprint),
      userId:            String(r.user_id),
      contentId:         String(r.content_id),
      ruleId:            String(r.rule_id),
      failureCategory:   r.failure_category as FailureCategory,
      failureReason:     String(r.failure_reason ?? ""),
      lastWorkerId:      r.last_worker_id ? String(r.last_worker_id) : null,
      lastErrorSnapshot: String(r.last_error_snapshot ?? ""),
      payload:           (r.payload as Record<string, unknown>) ?? {},
      retryCount:        Number(r.retry_count),
      lastAttemptAt:     String(r.last_attempt_at),
      createdAt:         String(r.created_at),
    }));
  },
};
