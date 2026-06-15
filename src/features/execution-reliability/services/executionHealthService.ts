import { supabase } from "@/lib/supabase";
import type { ExecutionHealth, ExecutionMetrics, HealthState } from "../types";

export const executionHealthService = {
  async compute(userId: string): Promise<ExecutionHealth> {
    const [{ data: results }, { count: dlqCount }] = await Promise.all([
      supabase.from("execution_results").select("status, completed_at, created_at").eq("user_id", userId).limit(500),
      supabase.from("execution_dlq").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const rows        = results ?? [];
    const successCount = rows.filter((r) => r.status === "completed").length;
    const failedCount  = rows.filter((r) => r.status === "failed").length;

    const durations = rows
      .filter((r) => r.completed_at && r.created_at)
      .map((r) => new Date(r.completed_at).getTime() - new Date(r.created_at).getTime());
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const { data: dlqRows } = await supabase
      .from("execution_dlq")
      .select("retry_count")
      .eq("user_id", userId);
    const retryCount = (dlqRows ?? []).reduce((s, r) => s + Number(r.retry_count ?? 0), 0);

    const metrics: ExecutionMetrics = {
      successCount,
      failedCount,
      dlqCount:     dlqCount ?? 0,
      avgDurationMs,
      retryCount,
    };

    const avgDurationPenalty = Math.min(20, Math.floor(avgDurationMs / 5000));
    let score = 100 - (failedCount * 5) - ((dlqCount ?? 0) * 10) - avgDurationPenalty;
    score = Math.max(0, Math.min(100, score));

    const state: HealthState =
      score >= 80 ? "healthy" :
      score >= 60 ? "degraded" :
      score >= 40 ? "unstable" : "critical";

    return { metrics, healthScore: score, state };
  },
};
