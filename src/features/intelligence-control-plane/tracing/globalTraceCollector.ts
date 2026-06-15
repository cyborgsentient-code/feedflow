import type { SystemEvent } from "../types";

/** In-memory ring buffer — max 2000 events, evicts oldest on overflow. */
const MAX = 2000;
const buffer: SystemEvent[] = [];

export const globalTraceCollector = {
  record(event: SystemEvent): void {
    if (buffer.length >= MAX) buffer.shift();
    buffer.push(event);
  },

  /** All events for a userId, chronological. */
  forUser(userId: string): SystemEvent[] {
    return buffer.filter((e) => e.userId === userId);
  },

  /** All events for a specific entityId (contentId, jobId, etc.). */
  forEntity(entityId: string): SystemEvent[] {
    return buffer.filter((e) => e.entityId === entityId);
  },

  all(): SystemEvent[] {
    return [...buffer];
  },

  flush(): void {
    buffer.length = 0;
  },
};
