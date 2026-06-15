import { systemDashboardService } from "@/features/dashboard-aggregation/dashboard/systemDashboardService";
import { dlqOps }                  from "../operations/dlqOps";
import type { ModuleSnapshot }     from "../types";
import type { ModuleType }         from "@/features/intelligence-control-plane/types";

type DLQModule = "automation" | "execution" | "ai" | "intelligence";

export const moduleInspector = {
  async inspect(module: ModuleType, userId: string): Promise<ModuleSnapshot> {
    const overview   = await systemDashboardService.build(userId);
    const health     = overview.moduleHealthBreakdown[module];

    let dlqDepth = 0;
    if (module !== "feed") {
      const rows = await dlqOps.inspect(module as DLQModule, userId);
      dlqDepth   = rows.length;
    }

    return {
      module,
      healthScore:  health.score,
      state:        health.state,
      dlqDepth,
      failureRate:  0,
      avgLatencyMs: 0,
      computedAt:   overview.computedAt,
    };
  },
};
