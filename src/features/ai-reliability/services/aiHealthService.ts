import { supabase } from "@/lib/supabase";
import type { AIHealth, AIMetrics, AIHealthState } from "../types";

export const aiHealthService = {
  async compute(userId: string): Promise<AIHealth> {
    const [{ data: jobs }, { count: dlqCount }] = await Promise.all([
      supabase.from("ai_jobs").select("status, completed_at, created_at").eq("user_id", userId).limit(500),
      supabase.from("ai_dlq").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const rows         = jobs ?? [];
    const completedJobs = rows.filter((r) => r.status === "completed").length;
    const failedJobs    = rows.filter((r) => r.status === "failed").length;
    const durations     = rows
      .filter((r) => r.completed_at && r.created_at)
      .map((r) => new Date(r.completed_at).getTime() - new Date(r.created_at).getTime());
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const { data: budgetRow } = await supabase.from("ai_budgets").select("daily_usage_usd, daily_budget_usd").eq("user_id", userId).maybeSingle();
    const budgetUtilization = budgetRow?.daily_budget_usd
      ? (budgetRow.daily_usage_usd / budgetRow.daily_budget_usd) * 100 : 0;

    const metrics: AIMetrics = {
      totalJobs:         rows.length,
      completedJobs,
      failedJobs,
      replayedJobs:      0,
      dlqEntries:        dlqCount ?? 0,
      estimatedTokens:   0,
      estimatedCostUsd:  0,
      averageDurationMs: avgDurationMs,
      successRate:       rows.length > 0 ? completedJobs / rows.length : 1,
    };

    let score = 100
      - failedJobs * 5
      - (dlqCount ?? 0) * 10
      - Math.min(20, Math.floor(avgDurationMs / 5000))
      - Math.min(20, Math.floor(budgetUtilization / 5));
    score = Math.max(0, Math.min(100, score));

    const state: AIHealthState =
      score >= 80 ? "healthy" : score >= 60 ? "degraded" : score >= 40 ? "unstable" : "critical";

    return { metrics, healthScore: score, state };
  },
};
