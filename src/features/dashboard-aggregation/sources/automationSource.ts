import { supabase } from "@/lib/supabase";
import type { DashboardEvent, ModuleSummary, TimeWindow } from "../types";
import { windowStart } from "../utils/timeWindowUtils";
import { successRate, round2 } from "../utils/metricNormalization";

export const automationSource = {
  async getEvents(userId: string, window: TimeWindow): Promise<DashboardEvent[]> {
    const { data } = await supabase
      .from("automation_queue")
      .select("id, user_id, content_id, status, attempts, created_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window))
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((r) => ({
      id:        String(r.id),
      userId:    String(r.user_id),
      module:    "automation" as const,
      type:      r.status === "failed" ? "automation_failed" : "automation_triggered",
      timestamp: String(r.created_at),
      entityId:  String(r.content_id ?? r.id),
      severity:  r.status === "failed" ? ("critical" as const) : ("info" as const),
      metadata:  { status: r.status, attempts: r.attempts },
    }));
  },

  async getSummary(userId: string, window: TimeWindow): Promise<ModuleSummary> {
    const { data } = await supabase
      .from("automation_queue")
      .select("status, attempts")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window));

    const rows    = data ?? [];
    const failed  = rows.filter((r) => r.status === "failed" || r.status === "dead").length;
    const success = rows.filter((r) => r.status === "done").length;
    const retries = rows.reduce((s, r) => s + Number(r.attempts ?? 1), 0) - rows.length;

    const { count: dlq } = await supabase
      .from("automation_dlq")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      module:       "automation",
      totalEvents:  rows.length,
      successCount: success,
      failureCount: failed,
      successRate:  round2(successRate(success, rows.length)),
      avgLatencyMs: 0,
      dlqDepth:     dlq ?? 0,
      window,
    };
  },
};
