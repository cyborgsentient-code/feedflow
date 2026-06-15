import type { DashboardEvent, ModuleSummary, TimeWindow } from "../types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";

/** Rolling in-memory state window for hot reads (avoids DB round-trips for recent events). */

type ModuleState = {
  events:    DashboardEvent[];
  summary:   ModuleSummary | null;
  updatedAt: number;
};

const TTL_MS = 60_000; // 1-minute hot cache per user+module

const store = new Map<string, ModuleState>();

function key(userId: string, module: ModuleType): string {
  return `${userId}:${module}`;
}

function isStale(state: ModuleState): boolean {
  return Date.now() - state.updatedAt > TTL_MS;
}

export const realtimeStateAggregator = {
  patch(userId: string, module: ModuleType, event: DashboardEvent): void {
    const k     = key(userId, module);
    const state = store.get(k) ?? { events: [], summary: null, updatedAt: 0 };
    // Keep last 500 events in memory per module per user
    if (state.events.length >= 500) state.events.shift();
    state.events.push(event);
    state.updatedAt = Date.now();
    store.set(k, state);
  },

  setSnapshot(userId: string, module: ModuleType, events: DashboardEvent[], summary: ModuleSummary): void {
    store.set(key(userId, module), { events, summary, updatedAt: Date.now() });
  },

  getHot(userId: string, module: ModuleType): { events: DashboardEvent[]; summary: ModuleSummary | null } | null {
    const state = store.get(key(userId, module));
    if (!state || isStale(state)) return null;
    return { events: state.events, summary: state.summary };
  },

  evict(userId: string): void {
    for (const k of store.keys()) {
      if (k.startsWith(`${userId}:`)) store.delete(k);
    }
  },
};
