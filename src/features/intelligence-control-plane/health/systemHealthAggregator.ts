import { supabase } from "@/lib/supabase";
import type { SystemHealth, ModuleHealthScore } from "../types";
import { computeModuleHealthScore } from "./moduleHealthScore";
import { MODULE_WEIGHTS } from "./healthThresholds";

async function fetchModuleStats(
  table: string,
  dlqTable: string,
  userId: string,
  statusCol = "status",
): Promise<{ total: number; failed: number; dlq: number; avgMs: number; retries: number }> {
  const [{ data: rows }, { count: dlq }, { data: dlqRows }] = await Promise.all([
    supabase.from(table).select(`${statusCol}, created_at, completed_at`).eq("user_id", userId).limit(500),
    supabase.from(dlqTable).select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from(dlqTable).select("retry_count").eq("user_id", userId),
  ]);

  const all     = rows ?? [];
  const failed  = all.filter((r: Record<string, unknown>) => r[statusCol] === "failed").length;
  const durations = all
    .filter((r: Record<string, unknown>) => r.completed_at && r.created_at)
    .map((r: Record<string, unknown>) =>
      new Date(String(r.completed_at)).getTime() - new Date(String(r.created_at)).getTime()
    );
  const avgMs   = durations.length
    ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
    : 0;
  const retries = (dlqRows ?? []).reduce((s: number, r: Record<string, unknown>) => s + Number(r.retry_count ?? 0), 0);

  return { total: all.length, failed, dlq: dlq ?? 0, avgMs, retries };
}

export const systemHealthAggregator = {
  async compute(userId: string): Promise<SystemHealth> {
    const [feedStats, autoStats, execStats, aiStats, intelStats] = await Promise.all([
      // feed: use content_items as proxy
      fetchModuleStats("content_items",      "content_items",      userId, "status"),
      fetchModuleStats("automation_queue",   "automation_dlq",     userId, "status"),
      fetchModuleStats("execution_results",  "execution_dlq",      userId, "status"),
      fetchModuleStats("ai_jobs",            "ai_dlq",             userId, "status"),
      fetchModuleStats("user_interactions",  "profile_dlq",        userId, "status"),
    ]);

    const feedHealth:         ModuleHealthScore = computeModuleHealthScore("feed",         feedStats.total,  feedStats.failed,  feedStats.dlq,  feedStats.avgMs,  feedStats.retries);
    const automationHealth:   ModuleHealthScore = computeModuleHealthScore("automation",   autoStats.total,  autoStats.failed,  autoStats.dlq,  autoStats.avgMs,  autoStats.retries);
    const executionHealth:    ModuleHealthScore = computeModuleHealthScore("execution",    execStats.total,  execStats.failed,  execStats.dlq,  execStats.avgMs,  execStats.retries);
    const aiHealth:           ModuleHealthScore = computeModuleHealthScore("ai",           aiStats.total,    aiStats.failed,    aiStats.dlq,    aiStats.avgMs,    aiStats.retries);
    const intelligenceHealth: ModuleHealthScore = computeModuleHealthScore("intelligence", intelStats.total, intelStats.failed, intelStats.dlq, intelStats.avgMs, intelStats.retries);

    const globalScore = Math.round(
      feedHealth.score         * MODULE_WEIGHTS.feed         +
      automationHealth.score   * MODULE_WEIGHTS.automation   +
      executionHealth.score    * MODULE_WEIGHTS.execution    +
      aiHealth.score           * MODULE_WEIGHTS.ai           +
      intelligenceHealth.score * MODULE_WEIGHTS.intelligence,
    );

    return {
      feedHealth,
      automationHealth,
      executionHealth,
      aiHealth,
      intelligenceHealth,
      globalScore,
      computedAt: new Date().toISOString(),
    };
  },
};
