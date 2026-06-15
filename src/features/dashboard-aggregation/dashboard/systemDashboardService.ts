import type { SystemOverview, ThroughputMetrics } from "../types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";
import { controlPlaneSource }  from "../sources/controlPlaneSource";
import { aiSource }            from "../sources/aiSource";
import { metricAggregator }    from "../aggregation/metricAggregator";

export const systemDashboardService = {
  /**
   * userId is the requesting admin's userId — passed to controlPlane health only.
   * Aggregation uses global tables, scoped by the requesting user's context.
   */
  async build(userId: string): Promise<SystemOverview> {
    const [health, ksState, policies, costSummary, sysMetrics] = await Promise.all([
      controlPlaneSource.getHealth(userId),
      Promise.resolve(controlPlaneSource.getKillSwitchState()),
      Promise.resolve(controlPlaneSource.getPolicies()),
      aiSource.getCostSummary(userId),
      metricAggregator.getSystemMetrics(userId, "5m"),
    ]);

    const modules: ModuleType[] = ["feed", "automation", "execution", "ai", "intelligence"];

    const moduleHealthBreakdown = Object.fromEntries(
      modules.map((m) => {
        const mh = {
          feed:         health.feedHealth,
          automation:   health.automationHealth,
          execution:    health.executionHealth,
          ai:           health.aiHealth,
          intelligence: health.intelligenceHealth,
        }[m]!;
        return [m, { score: mh.score, state: mh.state }];
      }),
    ) as Record<ModuleType, { score: number; state: string }>;

    const topFailingModules = modules
      .map((m) => ({ m, score: moduleHealthBreakdown[m]!.score }))
      .sort((a, b) => a.score - b.score)
      .filter((x) => x.score < 80)
      .map((x) => x.m);

    const get = (name: string) => sysMetrics.find((m) => m.name === name)?.value ?? 0;
    const throughputMetrics: ThroughputMetrics = {
      eventsPerSecond:   get("events_per_second"),
      automationsPerMin: get("automations_per_min"),
      executionsPerMin:  get("executions_per_min"),
      aiTasksPerMin:     get("ai_tasks_per_min"),
    };

    return {
      globalHealthScore:     health.globalScore,
      moduleHealthBreakdown,
      topFailingModules,
      costSummary,
      throughputMetrics,
      killSwitchStatus:      ksState,
      activePolicies:        policies.filter((p) => p.enabled),
      computedAt:            new Date().toISOString(),
    };
  },
};
