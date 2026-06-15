import type { SystemTrace, ModuleType, SystemEventType } from "../types";
import { traceCorrelator } from "./traceCorrelator";

export const traceQueryService = {
  getChain(entityId: string): SystemTrace | null {
    return traceCorrelator.buildChain(entityId);
  },

  getUserTimeline(userId: string): SystemTrace[] {
    return traceCorrelator.buildUserChains(userId);
  },

  /** Filter a user's chains to only those involving a specific module. */
  getByModule(userId: string, module: ModuleType): SystemTrace[] {
    return traceCorrelator
      .buildUserChains(userId)
      .filter((t) => t.events.some((e) => e.module === module));
  },

  /** Find chains that contain a specific event type. */
  getByEventType(userId: string, type: SystemEventType): SystemTrace[] {
    return traceCorrelator
      .buildUserChains(userId)
      .filter((t) => t.events.some((e) => e.type === type));
  },
};
