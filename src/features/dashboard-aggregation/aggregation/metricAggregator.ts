import type { DashboardMetric, TimeWindow } from "../types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";
import { feedSource }         from "../sources/feedSource";
import { automationSource }   from "../sources/automationSource";
import { executionSource }    from "../sources/executionSource";
import { aiSource }           from "../sources/aiSource";
import { intelligenceSource } from "../sources/intelligenceSource";
import { round2 } from "../utils/metricNormalization";

const WINDOWS: TimeWindow[] = ["1m", "5m", "1h", "24h"];

export const metricAggregator = {
  async getModuleMetrics(userId: string, module: ModuleType, window: TimeWindow): Promise<DashboardMetric[]> {
    const summaryFn = {
      feed:         () => feedSource.getSummary(userId, window),
      automation:   () => automationSource.getSummary(userId, window),
      execution:    () => executionSource.getSummary(userId, window),
      ai:           () => aiSource.getSummary(userId, window),
      intelligence: () => intelligenceSource.getSummary(userId, window),
    }[module];

    const s   = await summaryFn();
    const now = new Date().toISOString();

    return [
      { module, name: "event_count",   value: s.totalEvents,  unit: "count",   window, computedAt: now },
      { module, name: "success_rate",  value: s.successRate,  unit: "ratio",   window, computedAt: now },
      { module, name: "failure_count", value: s.failureCount, unit: "count",   window, computedAt: now },
      { module, name: "dlq_depth",     value: s.dlqDepth,     unit: "count",   window, computedAt: now },
      { module, name: "avg_latency_ms",value: s.avgLatencyMs, unit: "ms",      window, computedAt: now },
    ];
  },

  /** System-wide throughput metrics from raw event counts across a window. */
  async getSystemMetrics(userId: string, window: TimeWindow): Promise<DashboardMetric[]> {
    const [feed, auto, exec, ai, intel] = await Promise.all([
      feedSource.getSummary(userId, window),
      automationSource.getSummary(userId, window),
      executionSource.getSummary(userId, window),
      aiSource.getSummary(userId, window),
      intelligenceSource.getSummary(userId, window),
    ]);

    const windowMs    = { "1m": 60, "5m": 300, "1h": 3600, "24h": 86400, "7d": 604800 }[window] ?? 60;
    const totalEvents = feed.totalEvents + auto.totalEvents + exec.totalEvents + ai.totalEvents + intel.totalEvents;
    const now         = new Date().toISOString();

    return [
      { module: "system", name: "events_per_second",   value: round2(totalEvents / windowMs), unit: "eps",   window, computedAt: now },
      { module: "system", name: "automations_per_min", value: round2(auto.totalEvents / (windowMs / 60)), unit: "rpm", window, computedAt: now },
      { module: "system", name: "executions_per_min",  value: round2(exec.totalEvents / (windowMs / 60)), unit: "rpm", window, computedAt: now },
      { module: "system", name: "ai_tasks_per_min",    value: round2(ai.totalEvents   / (windowMs / 60)), unit: "rpm", window, computedAt: now },
      { module: "system", name: "execution_success_ratio", value: exec.successRate, unit: "ratio", window, computedAt: now },
    ];
  },
};
