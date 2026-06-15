export type RawContent = {
  id:           string;
  source_id:    string;
  external_id?: string;
  title:        string;
  body:         string;
  media_urls:   string[];
  author?:      string;
  published_at: string;
  raw_payload:  unknown;
};

export type NormalizedContent = {
  id:           string;
  source_id:    string;
  fingerprint:  string;
  title:        string;
  content:      string;
  media:        string[];
  author:       string | null;
  published_at: string;
  content_hash: string;
  created_at:   string;
};

export type IngestionStatus = "idle" | "processing" | "done" | "error";

export type IngestionError =
  | { code: "invalid_payload";      message: string }
  | { code: "duplicate_content";    message: string }
  | { code: "normalization_failed"; message: string }
  | { code: "unknown_source";       message: string }
  | { code: "unknown";              message: string };

export type IngestionResult =
  | { success: true;  processedCount: number }
  | { success: false; error: IngestionError };
