import { supabase } from "@/lib/supabase";
import type { DashboardEvent, ModuleSummary, TimeWindow } from "../types";
import { windowStart } from "../utils/timeWindowUtils";
import { successRate, round2 } from "../utils/metricNormalization";

export const feedSource = {
  async getEvents(userId: string, window: TimeWindow): Promise<DashboardEvent[]> {
    const { data } = await supabase
      .from("feed_items")
      .select("id, user_id, content_id, source_id, rank_score, created_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart(window))
      .order("created_at", { ascending: false })
      .limit(200);

    return (data ?? []).map((r) => ({
      id:        String(r.id),
      userId:    String(r.user_id),
      module:    "feed" as const,
      type:      "content_ingested",
      timestamp: String(r.created_at),
      entityId:  String(r.content_id),
      severity:  "info" as const,
      metadata:  { sourceId: r.source_id, rankScore: r.rank_score },
    }));
  },

  async getSummary(userId: string, window: TimeWindow): Promise<ModuleSummary> {
    const { data, count } = await supabase
      .from("feed_items")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .gte("created_at", windowStart(window));

    return {
      module:       "feed",
      totalEvents:  count ?? 0,
      successCount: count ?? 0,
      failureCount: 0,
      successRate:  1,
      avgLatencyMs: 0,
      dlqDepth:     0,
      window,
    };
  },
};
