import { supabase } from "@/lib/supabase";
import type { NormalizedContent, ContentItem, StorageResult } from "../types";
import { mapError } from "./storageErrors";

function fromNormalized(n: NormalizedContent): Omit<ContentItem, "engagement_score"> {
  return {
    id:           n.id,
    source_id:    n.source_id,
    fingerprint:  n.fingerprint,
    title:        n.title,
    content:      n.content,
    media_urls:   n.media,
    author:       n.author,
    published_at: n.published_at,
    content_hash: n.content_hash,
    created_at:   n.created_at,
    metadata:     {},
  };
}

export const contentWriteService = {
  /** Insert a single item; silently ignores fingerprint conflicts. */
  async insertNormalizedContent(item: NormalizedContent): Promise<StorageResult<{ id: string }>> {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .upsert(fromNormalized(item), { onConflict: "fingerprint", ignoreDuplicates: true })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      // maybeSingle returns null when ignoreDuplicates suppresses the row
      return { success: true, data: { id: data?.id ?? item.id } };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  /** Bulk insert; duplicate fingerprints are silently ignored. */
  async bulkInsertContent(items: NormalizedContent[]): Promise<StorageResult<{ inserted: number }>> {
    if (items.length === 0) return { success: true, data: { inserted: 0 } };
    try {
      const { error, count } = await supabase
        .from("content_items")
        .upsert(items.map(fromNormalized), { onConflict: "fingerprint", ignoreDuplicates: true })
        .select("id", { count: "estimated" });
      if (error) throw error;
      return { success: true, data: { inserted: count ?? 0 } };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  /** Explicit upsert — updates content_hash if body changed. */
  async upsertByFingerprint(item: NormalizedContent): Promise<StorageResult<{ id: string }>> {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .upsert(fromNormalized(item), { onConflict: "fingerprint" })
        .select("id")
        .single();
      if (error) throw error;
      return { success: true, data: { id: String(data.id) } };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
