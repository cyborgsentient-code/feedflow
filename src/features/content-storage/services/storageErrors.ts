import type { FeedServiceError } from "../types";

export function mapError(e: unknown): FeedServiceError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not found") || msg.includes("PGRST116"))
    return { code: "not_found",       message: "Content not found." };
  if (msg.includes("403") || msg.includes("RLS") || msg.includes("permission") || msg.includes("denied"))
    return { code: "forbidden",       message: "You don't have permission to do that." };
  if (msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate"))
    return { code: "duplicate_feed_item", message: "Content already in feed." };
  if (msg.includes("invalid") || msg.includes("violates"))
    return { code: "invalid_content", message: "Invalid content data." };
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("storage"))
    return { code: "storage_failure", message: "Storage error. Please try again." };
  return { code: "unknown", message: "Something went wrong. Please try again." };
}
