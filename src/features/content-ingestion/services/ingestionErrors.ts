import type { IngestionError } from "../types";

export function mapIngestionError(e: unknown): IngestionError {
  if (e && typeof e === "object" && "code" in e) return e as IngestionError;
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("invalid") || msg.includes("parse") || msg.includes("required"))
    return { code: "invalid_payload",      message: "Content payload is invalid." };
  if (msg.includes("duplicate") || msg.includes("fingerprint"))
    return { code: "duplicate_content",    message: "Content already ingested." };
  if (msg.includes("normalize"))
    return { code: "normalization_failed", message: "Content could not be normalized." };
  if (msg.includes("unknown_source") || msg.includes("source_id"))
    return { code: "unknown_source",       message: "Source not recognized." };
  return { code: "unknown", message: "Ingestion failed. Please try again." };
}
