import { supabase } from "@/lib/supabase";
import type { PreferenceProfileSnapshot } from "../types";

/** Two-layer cache: memory (hot) → DB (persistence). */
const memoryCache = new Map<string, PreferenceProfileSnapshot>();

export const profileCache = {
  getFromMemory(userId: string): PreferenceProfileSnapshot | undefined {
    return memoryCache.get(userId);
  },

  setInMemory(snapshot: PreferenceProfileSnapshot): void {
    memoryCache.set(snapshot.userId, snapshot);
  },

  evict(userId: string): void {
    memoryCache.delete(userId);
  },

  async getFromDB(userId: string): Promise<PreferenceProfileSnapshot | null> {
    const { data, error } = await supabase
      .from("user_preference_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return {
      userId:                  String(data.user_id),
      profileVersion:          Number(data.profile_version),
      sourceAffinity:          (data.source_affinity as Record<string, number>) ?? {},
      contentCategoryAffinity: (data.content_category_affinity as Record<string, number>) ?? {},
      lastComputedAt:          String(data.last_computed_at),
      hash:                    String(data.hash),
    };
  },

  async persistToDB(snapshot: PreferenceProfileSnapshot): Promise<void> {
    await supabase
      .from("user_preference_profiles")
      .upsert(
        {
          user_id:                   snapshot.userId,
          profile_version:           snapshot.profileVersion,
          source_affinity:           snapshot.sourceAffinity,
          content_category_affinity: snapshot.contentCategoryAffinity,
          last_computed_at:          snapshot.lastComputedAt,
          hash:                      snapshot.hash,
        },
        { onConflict: "user_id" },
      );
  },

  /** Memory-first read, falls back to DB and warms memory. */
  async get(userId: string): Promise<PreferenceProfileSnapshot | null> {
    const mem = memoryCache.get(userId);
    if (mem) return mem;
    const db = await profileCache.getFromDB(userId);
    if (db) memoryCache.set(userId, db);
    return db;
  },

  /** Write-through: memory then DB. */
  async set(snapshot: PreferenceProfileSnapshot): Promise<void> {
    memoryCache.set(snapshot.userId, snapshot);
    await profileCache.persistToDB(snapshot);
  },
};
