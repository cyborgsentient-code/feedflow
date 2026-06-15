import type { RecommendationSignal } from "../types";

const STALE_MS = 10 * 60 * 1000; // 10 minutes

type CacheEntry = {
  signals:          RecommendationSignal[];
  profileVersion:   number;
  cachedAt:         number;
};

const cache = new Map<string, CacheEntry>();

function cacheKey(userId: string, profileVersion: number): string {
  return `${userId}:${profileVersion}`;
}

export const signalCache = {
  get(userId: string, profileVersion: number): RecommendationSignal[] | null {
    const entry = cache.get(cacheKey(userId, profileVersion));
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > STALE_MS) return null; // stale
    return entry.signals;
  },

  set(userId: string, profileVersion: number, signals: RecommendationSignal[]): void {
    // Evict any prior version for this user
    for (const k of cache.keys()) {
      if (k.startsWith(`${userId}:`)) cache.delete(k);
    }
    cache.set(cacheKey(userId, profileVersion), {
      signals,
      profileVersion,
      cachedAt: Date.now(),
    });
  },

  isStale(userId: string, profileVersion: number): boolean {
    const entry = cache.get(cacheKey(userId, profileVersion));
    if (!entry) return true;
    return Date.now() - entry.cachedAt > STALE_MS;
  },

  evict(userId: string): void {
    for (const k of cache.keys()) {
      if (k.startsWith(`${userId}:`)) cache.delete(k);
    }
  },
};
