import { systemDashboardService } from "@/features/dashboard-aggregation/dashboard/systemDashboardService";
import type { SystemSnapshot, ModuleSnapshot } from "../types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";

export const systemInspector = {
  async snapshot(adminUserId: string): Promise<SystemSnapshot> {
    const overview = await systemDashboardService.build(adminUserId);

    const modules: ModuleType[] = ["feed", "automation", "execution", "ai", "intelligence"];
    const moduleSnapshots: ModuleSnapshot[] = modules.map((m) => {
      const h = overview.moduleHealthBreakdown[m];
      return {
        module:       m,
        healthScore:  h.score,
        state:        h.state,
        dlqDepth:     0,   // populated by moduleInspector when needed
        failureRate:  0,
        avgLatencyMs: 0,
        computedAt:   overview.computedAt,
      };
    });

    return {
      globalScore:  overview.globalHealthScore,
      modules:      moduleSnapshots,
      killSwitches: overview.killSwitchStatus as Record<string, string | null>,
      computedAt:   overview.computedAt,
    };
  },
};
