import { supabase } from "@/lib/supabase";
import type { ContentItem, StorageResult } from "../types";
import { mapError } from "./storageErrors";

const PAGE_SIZE = 30;

function rowToContentItem(r: Record<string, unknown>): ContentItem {
  return {
    id:               String(r.id),
    source_id:        String(r.source_id),
    fingerprint:      String(r.fingerprint),
    title:            String(r.title),
    content:          String(r.content),
    media_urls:       Array.isArray(r.media_urls) ? (r.media_urls as string[]) : [],
    author:           r.author != null ? String(r.author) : null,
    published_at:     String(r.published_at),
    content_hash:     String(r.content_hash),
    created_at:       String(r.created_at),
    engagement_score: typeof r.engagement_score === "number" ? r.engagement_score : null,
    metadata:         (r.metadata as Record<string, unknown>) ?? {},
  };
}

export const contentReadService = {
  async getContentById(id: string, userId: string): Promise<StorageResult<ContentItem>> {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)         // ownership enforced
        .single();
      if (error) throw error;
      return { success: true, data: rowToContentItem(data as Record<string, unknown>) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getContentBySource(sourceId: string, userId: string): Promise<StorageResult<ContentItem[]>> {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("source_id", sourceId)
        .eq("user_id", userId)
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToContentItem(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getRecentContent(userId: string): Promise<StorageResult<ContentItem[]>> {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("user_id", userId)
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return { success: true, data: (data ?? []).map((r) => rowToContentItem(r as Record<string, unknown>)) };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
