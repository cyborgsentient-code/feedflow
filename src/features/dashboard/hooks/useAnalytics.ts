import { useMemo } from "react";
import type { AutomationEvent, StreamSnapshot } from "@/features/automation/types/event";

export type DerivedAnalytics = {
  total: number;
  likes: number;
  views: number;
  searches: number;
  visits: number;
  lastActivity: number | null;
  sessionDurationMs: number | null;
};

export function deriveAnalytics(events: AutomationEvent[]): DerivedAnalytics {
  if (events.length === 0) {
    return { total: 0, likes: 0, views: 0, searches: 0, visits: 0, lastActivity: null, sessionDurationMs: null };
  }

  let likes = 0, views = 0, searches = 0, visits = 0;
  const newest = events[0].timestamp;
  const oldest = events[events.length - 1].timestamp;

  for (const e of events) {
    if (e.type === "like")   likes++;
    if (e.type === "view")   views++;
    if (e.type === "search") searches++;
    if (e.type === "visit")  visits++;
  }

  return { total: events.length, likes, views, searches, visits, lastActivity: newest, sessionDurationMs: newest - oldest };
}

/** snapshot is passed solely to key the memo on recoveryState changes. */
export function useAnalytics(snapshot: StreamSnapshot, events: AutomationEvent[]): DerivedAnalytics {
  return useMemo(() => deriveAnalytics(events), [events, snapshot.recoveryState]);
}
