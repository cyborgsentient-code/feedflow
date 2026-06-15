import type { DashboardWidget, UserDashboardState, SystemOverview, TimeWindow } from "../types";
import { buildTimeline } from "../aggregation/timelineBuilder";

/** Deterministic widget ID — same inputs always produce same ID. Pure. */
function wid(title: string, timeframe: string, module?: string): string {
  return `w:${module ?? "system"}:${timeframe}:${title.toLowerCase().replace(/\s+/g, "-")}`;
}

export const widgetComposer = {
  /** Pure: same state + window → same widgets. No side effects. */
  forUser(state: UserDashboardState, window: TimeWindow): DashboardWidget[] {
    const timeline = buildTimeline(state.activityTimeline, window);
    return [
      { id: wid("Activity Timeline", window),    type: "timeline", title: "Activity Timeline", timeframe: window, data: timeline },
      { id: wid("Feed Items", window, "feed"),    type: "metric",   title: "Feed Items",        timeframe: window, module: "feed",         data: { total: state.feedSummary.totalEvents,        successRate: state.feedSummary.successRate } },
      { id: wid("Automations", window, "automation"), type: "metric", title: "Automations",   timeframe: window, module: "automation",   data: { total: state.automationSummary.totalEvents,  successRate: state.automationSummary.successRate, dlq: state.automationSummary.dlqDepth } },
      { id: wid("Executions", window, "execution"),   type: "metric", title: "Executions",    timeframe: window, module: "execution",    data: { total: state.executionSummary.totalEvents,   successRate: state.executionSummary.successRate,  avgLatencyMs: state.executionSummary.avgLatencyMs } },
      { id: wid("AI Tasks", window, "ai"),        type: "metric",   title: "AI Tasks",          timeframe: window, module: "ai",          data: { total: state.aiSummary.totalEvents,          successRate: state.aiSummary.successRate,          dlq: state.aiSummary.dlqDepth } },
      { id: wid("System Health", window),         type: "metric",   title: "System Health",     timeframe: window, data: { score: state.healthScore } },
    ];
  },

  /** Pure: same overview → same widgets. No side effects. */
  forSystem(overview: SystemOverview): DashboardWidget[] {
    return [
      { id: wid("Global Health Score", "5m"),      type: "metric",   title: "Global Health Score",    timeframe: "5m",  data: { score: overview.globalHealthScore } },
      { id: wid("Module Health Breakdown", "5m"),  type: "heatmap",  title: "Module Health Breakdown", timeframe: "5m",  data: overview.moduleHealthBreakdown },
      { id: wid("AI Cost", "24h", "ai"),           type: "metric",   title: "AI Cost",                timeframe: "24h", module: "ai", data: overview.costSummary },
      { id: wid("Throughput", "5m"),               type: "chart",    title: "Throughput",             timeframe: "5m",  data: overview.throughputMetrics },
      { id: wid("Kill Switch Status", "1m"),       type: "metric",   title: "Kill Switch Status",     timeframe: "1m",  data: overview.killSwitchStatus },
    ];
  },
};
