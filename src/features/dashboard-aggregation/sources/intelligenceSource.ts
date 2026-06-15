import { supabase } from "@/lib/supabase";
import type { DashboardEvent, ModuleSummary, TimeWindow } from "../types";
import { windowStart } from "../utils/timeWindowUtils";
import { successRate, round2 } from "../utils/metricNormalization";

export const intelligenceSource = {
  async getEvents(userId: string, window: TimeWindow): Promise<DashboardEvent[]> {
    const { data } = await supabase
      .from("user_interactions")
      .select("id, user_id, content_id, source_id, interaction, created_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window))
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((r) => ({
      id:        String(r.id),
      userId:    String(r.user_id),
      module:    "intelligence" as const,
      type:      "profile_updated",
      timestamp: String(r.created_at),
      entityId:  String(r.content_id ?? r.id),
      severity:  "info" as const,
      metadata:  { interaction: r.interaction, sourceId: r.source_id },
    }));
  },

  async getSummary(userId: string, window: TimeWindow): Promise<ModuleSummary> {
    const { count: total } = await supabase
      .from("user_interactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart(window));

    const { count: dlq } = await supabase
      .from("profile_dlq")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      module: "intelligence", totalEvents: total ?? 0, successCount: total ?? 0,
      failureCount: dlq ?? 0, successRate: round2(successRate(total ?? 0, (total ?? 0) + (dlq ?? 0))),
      avgLatencyMs: 0, dlqDepth: dlq ?? 0, window,
    };
  },
};
