import type { DashboardEvent, TimeWindow } from "../types";
import { feedSource }          from "../sources/feedSource";
import { automationSource }    from "../sources/automationSource";
import { executionSource }     from "../sources/executionSource";
import { aiSource }            from "../sources/aiSource";
import { intelligenceSource }  from "../sources/intelligenceSource";

/** Merge events from all modules, sorted newest-first. */
export const eventAggregator = {
  async getAllEvents(userId: string, window: TimeWindow): Promise<DashboardEvent[]> {
    const [feed, automation, execution, ai, intelligence] = await Promise.all([
      feedSource.getEvents(userId, window),
      automationSource.getEvents(userId, window),
      executionSource.getEvents(userId, window),
      aiSource.getEvents(userId, window),
      intelligenceSource.getEvents(userId, window),
    ]);

    return [...feed, ...automation, ...execution, ...ai, ...intelligence].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },

  /** All events grouped by entityId for cross-module stitching. */
  groupByEntity(events: DashboardEvent[]): Map<string, DashboardEvent[]> {
    const map = new Map<string, DashboardEvent[]>();
    for (const e of events) {
      const bucket = map.get(e.entityId) ?? [];
      bucket.push(e);
      map.set(e.entityId, bucket);
    }
    return map;
  },
};
