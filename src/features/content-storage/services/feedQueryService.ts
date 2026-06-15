import { supabase } from "@/lib/supabase";
import type { FeedItem, FeedBucket, FeedCursor, StorageResult } from "../types";
import { mapError } from "./storageErrors";

const PAGE_SIZE = 20;

function rowToFeedItem(r: Record<string, unknown>): FeedItem {
  return {
    id:              String(r.id),
    user_id:         String(r.user_id),
    content_id:      String(r.content_id),
    source_id:       String(r.source_id),
    rank_score:      Number(r.rank_score),
    relevance_score: Number(r.relevance_score),
    decay_score:     Number(r.decay_score),
    feed_bucket:     r.feed_bucket as FeedBucket,
    created_at:      String(r.created_at),
  };
}

export const feedQueryService = {
  /** Cursor-based, ordered by rank_score DESC, created_at DESC. */
  async getUserFeed(userId: string, cursor?: FeedCursor): Promise<StorageResult<FeedItem[]>> {
    try {
      let query = supabase
        .from("feed_items")
        .select("*")
        .eq("user_id", userId)
        .order("rank_score",  { ascending: false })
        .order("created_at",  { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) {
        // keyset pagination: rows strictly after the cursor position
        query = query.or(
          `rank_score.lt.${cursor.rank_score},and(rank_score.eq.${cursor.rank_score},created_at.lt.${cursor.created_at})`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToFeedItem(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getFeedByBucket(userId: string, bucket: FeedBucket): Promise<StorageResult<FeedItem[]>> {
    try {
      const { data, error } = await supabase
        .from("feed_items")
        .select("*")
        .eq("user_id",    userId)
        .eq("feed_bucket", bucket)
        .order("rank_score",  { ascending: false })
        .order("created_at",  { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToFeedItem(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getSourceFeed(userId: string, sourceId: string): Promise<StorageResult<FeedItem[]>> {
    try {
      const { data, error } = await supabase
        .from("feed_items")
        .select("*")
        .eq("user_id",  userId)
        .eq("source_id", sourceId)
        .order("rank_score",  { ascending: false })
        .order("created_at",  { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToFeedItem(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
