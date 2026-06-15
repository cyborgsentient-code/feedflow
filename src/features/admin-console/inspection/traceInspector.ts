import { globalTraceCollector } from "@/features/intelligence-control-plane/tracing/globalTraceCollector";
import { traceQueryService }    from "@/features/intelligence-control-plane/tracing/traceQueryService";
import type { ModuleType, SystemEvent } from "@/features/intelligence-control-plane/types";

export type AdminTraceFilter = {
  userId?:       string;
  module?:       ModuleType;
  entityId?:     string;
  fromTs?:       string;
  toTs?:         string;
  failuresOnly?: boolean;
};

export const traceInspector = {
  /** Admin-level: can filter all users by module/entity/time. */
  query(filter: AdminTraceFilter): SystemEvent[] {
    let events = globalTraceCollector.all();

    if (filter.userId)   events = events.filter((e) => e.userId   === filter.userId);
    if (filter.module)   events = events.filter((e) => e.module   === filter.module);
    if (filter.entityId) events = events.filter((e) => e.entityId === filter.entityId);
    if (filter.fromTs)   events = events.filter((e) => e.timestamp >= filter.fromTs!);
    if (filter.toTs)     events = events.filter((e) => e.timestamp <= filter.toTs!);
    if (filter.failuresOnly) events = events.filter((e) => e.type.endsWith("_failed"));

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getEntityChain(entityId: string) {
    return traceQueryService.getChain(entityId);
  },

  getFailureChains(userId: string) {
    return traceQueryService
      .getUserTimeline(userId)
      .filter((c) => c.events.some((e) => e.type.endsWith("_failed")));
  },
};
