import type { ReplayRequest, ReplayResult } from "../types";
import { systemReplayService } from "./systemReplayService";
import { traceQueryService } from "../tracing/traceQueryService";

/**
 * Orchestrates replay of a full user timeline — chains all modules
 * in chronological order of recorded events.
 */
export const crossModuleReplayOrchestrator = {
  async replayTimeline(userId: string, callerUserId: string, mode: ReplayRequest["mode"]): Promise<ReplayResult[]> {
    const chains = traceQueryService.getUserTimeline(userId);
    const results: ReplayResult[] = [];

    for (const chain of chains) {
      const uniqueModules = [...new Set(chain.events.map((e) => e.module))];
      for (const module of uniqueModules) {
        const request: ReplayRequest = {
          id:          `replay-${chain.entityId}-${module}`,
          userId,
          module,
          entityId:    chain.entityId,
          mode,
          requestedAt: new Date().toISOString(),
        };
        results.push(await systemReplayService.replay(request, callerUserId));
      }
    }

    return results;
  },

  async replayEntity(
    entityId:     string,
    userId:       string,
    callerUserId: string,
    mode:         ReplayRequest["mode"],
  ): Promise<ReplayResult[]> {
    const chain = traceQueryService.getChain(entityId);
    if (!chain) return [{ requestId: entityId, action: "not_found" }];

    const uniqueModules = [...new Set(chain.events.map((e) => e.module))];
    return Promise.all(
      uniqueModules.map((module) =>
        systemReplayService.replay(
          { id: `replay-${entityId}-${module}`, userId, module, entityId, mode, requestedAt: new Date().toISOString() },
          callerUserId,
        ),
      ),
    );
  },
};
