import type { NormalizedContent } from "@/features/content-ingestion/types";

export type { NormalizedContent };

export type FeedBucket = "latest" | "source" | "recommended";

export type ContentItem = {
  id:               string;
  source_id:        string;
  fingerprint:      string;
  title:            string;
  content:          string;
  media_urls:       string[];
  author:           string | null;
  published_at:     string;
  content_hash:     string;
  created_at:       string;
  engagement_score: number | null;
  metadata:         Record<string, unknown>;
};

export type FeedItem = {
  id:               string;
  user_id:          string;
  content_id:       string;
  source_id:        string;
  rank_score:       number;
  relevance_score:  number;
  decay_score:      number;
  feed_bucket:      FeedBucket;
  created_at:       string;
};

export type FeedCursor = {
  rank_score:  number;
  created_at:  string;
};

export type FeedServiceError =
  | { code: "not_found";           message: string }
  | { code: "forbidden";           message: string }
  | { code: "invalid_content";     message: string }
  | { code: "duplicate_feed_item"; message: string }
  | { code: "storage_failure";     message: string }
  | { code: "unknown";             message: string };

export type StorageResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: FeedServiceError };
