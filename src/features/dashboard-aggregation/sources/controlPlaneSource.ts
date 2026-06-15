import { controlPlaneService } from "@/features/intelligence-control-plane/services/controlPlaneService";
import { traceQueryService } from "@/features/intelligence-control-plane/tracing/traceQueryService";
import type { SystemHealth, KillSwitchState, PolicyRule } from "@/features/intelligence-control-plane/types";

export const controlPlaneSource = {
  async getHealth(userId: string): Promise<SystemHealth> {
    return controlPlaneService.refreshHealth(userId);
  },

  getKillSwitchState(): KillSwitchState {
    return controlPlaneService.getKillSwitchState();
  },

  getPolicies(): PolicyRule[] {
    return controlPlaneService.getPolicies();
  },

  getTraceChain(entityId: string) {
    return traceQueryService.getChain(entityId);
  },

  getUserTimeline(userId: string) {
    return traceQueryService.getUserTimeline(userId);
  },
};
