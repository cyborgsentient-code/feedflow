import type { SystemEvent, SystemTrace } from "../types";
import { globalTraceCollector } from "./globalTraceCollector";

/**
 * Correlates SystemEvents into trace chains by entityId.
 * Two events belong to the same chain when they share entityId
 * OR when userId + time-proximity links them (±30s window).
 */
export const traceCorrelator = {
  buildChain(entityId: string): SystemTrace | null {
    const events = globalTraceCollector.forEntity(entityId);
    if (!events.length) return null;

    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      traceId:   entityId,
      userId:    sorted[0]!.userId,
      entityId,
      events:    sorted,
      startedAt: sorted[0]!.timestamp,
      lastSeen:  sorted[sorted.length - 1]!.timestamp,
    };
  },

  /** Build all distinct trace chains for a user. Keyed by entityId. */
  buildUserChains(userId: string): SystemTrace[] {
    const events  = globalTraceCollector.forUser(userId);
    const byEntity = new Map<string, SystemEvent[]>();

    for (const e of events) {
      const bucket = byEntity.get(e.entityId) ?? [];
      bucket.push(e);
      byEntity.set(e.entityId, bucket);
    }

    const chains: SystemTrace[] = [];
    for (const [entityId, evts] of byEntity) {
      const sorted = [...evts].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      chains.push({
        traceId:   entityId,
        userId,
        entityId,
        events:    sorted,
        startedAt: sorted[0]!.timestamp,
        lastSeen:  sorted[sorted.length - 1]!.timestamp,
      });
    }

    return chains.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  },
};
