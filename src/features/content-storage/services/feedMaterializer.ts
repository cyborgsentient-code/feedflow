import { supabase } from "@/lib/supabase";
import type { NormalizedContent, FeedItem, FeedBucket, StorageResult } from "../types";
import { computeRankScore } from "../utils/feedRanking";
import { mapError } from "./storageErrors";

function assignBucket(rankScore: number): FeedBucket {
  if (rankScore >= 0.6) return "latest";
  if (rankScore >= 0.3) return "source";
  return "recommended";
}

/**
 * Materialize normalized content into feed_items for a user.
 * Idempotent: upsert on (user_id, content_id) — re-runs do not duplicate rows.
 */
export const feedMaterializer = {
  async materialize(
    userId:         string,
    items:          NormalizedContent[],
    sourceAffinity: Record<string, number> = {},
  ): Promise<StorageResult<{ upserted: number }>> {
    if (items.length === 0) return { success: true, data: { upserted: 0 } };

    const now = Date.now();
    const feedRows = items.map((item) => {
      const affinity = sourceAffinity[item.source_id] ?? 0.5;
      const { rankScore, decayScore, relevanceScore } = computeRankScore(item.published_at, affinity, now);
      return {
        user_id:         userId,
        content_id:      item.id,
        source_id:       item.source_id,
        rank_score:      rankScore,
        relevance_score: relevanceScore,
        decay_score:     decayScore,
        feed_bucket:     assignBucket(rankScore),
        created_at:      new Date().toISOString(),
      };
    });

    try {
      const { error, count } = await supabase
        .from("feed_items")
        .upsert(feedRows, { onConflict: "user_id,content_id", ignoreDuplicates: false })
        .select("id", { count: "estimated" });
      if (error) throw error;
      return { success: true, data: { upserted: count ?? feedRows.length } };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
