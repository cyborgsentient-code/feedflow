import { supabase } from "@/lib/supabase";
import type { DashboardEvent, ModuleSummary, TimeWindow, CostSummary } from "../types";
import { windowStart } from "../utils/timeWindowUtils";
import { successRate, round2 } from "../utils/metricNormalization";

export const aiSource = {
  async getEvents(userId: string, window: TimeWindow): Promise<DashboardEvent[]> {
    const { data } = await supabase
      .from("ai_jobs")
      .select("id, user_id, content_id, status, task_type, created_at, completed_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window))
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((r) => ({
      id:        String(r.id),
      userId:    String(r.user_id),
      module:    "ai" as const,
      type:      r.status === "failed" ? "ai_task_failed" : "ai_task_completed",
      timestamp: String(r.created_at),
      entityId:  String(r.content_id ?? r.id),
      severity:  r.status === "failed" ? ("critical" as const) : ("info" as const),
      metadata:  { taskType: r.task_type, status: r.status },
    }));
  },

  async getSummary(userId: string, window: TimeWindow): Promise<ModuleSummary> {
    const { data } = await supabase
      .from("ai_jobs")
      .select("status, created_at, completed_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window));

    const rows    = data ?? [];
    const failed  = rows.filter((r) => r.status === "failed").length;
    const success = rows.filter((r) => r.status === "completed").length;
    const durations = rows
      .filter((r) => r.completed_at && r.created_at)
      .map((r) => new Date(r.completed_at).getTime() - new Date(r.created_at).getTime());
    const avgLatencyMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const { count: dlq } = await supabase
      .from("ai_dlq").select("id", { count: "exact", head: true }).eq("user_id", userId);

    return {
      module: "ai", totalEvents: rows.length, successCount: success,
      failureCount: failed, successRate: round2(successRate(success, rows.length)),
      avgLatencyMs, dlqDepth: dlq ?? 0, window,
    };
  },

  async getCostSummary(userId: string): Promise<CostSummary> {
    const { data } = await supabase
      .from("ai_budgets")
      .select("daily_usage_usd, monthly_usage_usd, daily_budget_usd, daily_tokens_used")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      dailyUsd:    round2(data?.daily_usage_usd   ?? 0),
      monthlyUsd:  round2(data?.monthly_usage_usd ?? 0),
      budgetPct:   data?.daily_budget_usd
        ? round2((data.daily_usage_usd / data.daily_budget_usd) * 100) : 0,
      dailyTokens: data?.daily_tokens_used ?? 0,
    };
  },
};
