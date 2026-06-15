import type { TraceFilter } from "../types";
import type { SystemTrace } from "@/features/intelligence-control-plane/types";
import { controlPlaneSource } from "../sources/controlPlaneSource";

/** Read-only. No mutations. */
export const traceExplorerService = {
  /** Single entity chain with optional filter applied. */
  getChain(entityId: string, userId: string, filter?: TraceFilter): SystemTrace | null {
    const chain = controlPlaneSource.getTraceChain(entityId);
    if (!chain || chain.userId !== userId) return null; // ownership
    return applyFilter(chain, filter);
  },

  /** Full user timeline filtered by options. */
  getTimeline(userId: string, filter?: TraceFilter): SystemTrace[] {
    const chains = controlPlaneSource.getUserTimeline(userId);
    return chains
      .map((c) => applyFilter(c, filter))
      .filter((c): c is SystemTrace => c !== null && c.events.length > 0);
  },

  /** Chains that contain at least one failure event — root-cause tracing. */
  getFailureChains(userId: string): SystemTrace[] {
    return controlPlaneSource.getUserTimeline(userId).filter((c) =>
      c.events.some((e) => e.type.endsWith("_failed")),
    );
  },
};

function applyFilter(chain: SystemTrace, filter?: TraceFilter): SystemTrace | null {
  if (!filter) return chain;

  let events = chain.events;

  if (filter.module)    events = events.filter((e) => e.module === filter.module);
  if (filter.fromTs)    events = events.filter((e) => e.timestamp >= filter.fromTs!);
  if (filter.toTs)      events = events.filter((e) => e.timestamp <= filter.toTs!);
  if (filter.failuresOnly) events = events.filter((e) => e.type.endsWith("_failed"));
  if (filter.entityId && chain.entityId !== filter.entityId) return null;

  return { ...chain, events };
}
