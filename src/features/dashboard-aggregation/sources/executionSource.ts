import { supabase } from "@/lib/supabase";
import type { DashboardEvent, ModuleSummary, TimeWindow } from "../types";
import { windowStart } from "../utils/timeWindowUtils";
import { successRate, round2 } from "../utils/metricNormalization";

export const executionSource = {
  async getEvents(userId: string, window: TimeWindow): Promise<DashboardEvent[]> {
    const { data } = await supabase
      .from("execution_results")
      .select("id, user_id, execution_id, status, created_at, completed_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window))
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((r) => ({
      id:        String(r.id),
      userId:    String(r.user_id),
      module:    "execution" as const,
      type:      r.status === "failed" ? "execution_failed" : "execution_completed",
      timestamp: String(r.created_at),
      entityId:  String(r.execution_id ?? r.id),
      severity:  r.status === "failed" ? ("critical" as const) : ("info" as const),
      metadata:  { status: r.status },
    }));
  },

  async getSummary(userId: string, window: TimeWindow): Promise<ModuleSummary> {
    const { data } = await supabase
      .from("execution_results")
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
      .from("execution_dlq")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      module: "execution", totalEvents: rows.length, successCount: success,
      failureCount: failed, successRate: round2(successRate(success, rows.length)),
      avgLatencyMs, dlqDepth: dlq ?? 0, window,
    };
  },
};
