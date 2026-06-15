import type { SourceServiceError } from "../types";

export function mapError(e: unknown): SourceServiceError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not found") || msg.includes("PGRST116"))
    return { code: "not_found",       message: "Source not found." };
  if (msg.includes("403") || msg.includes("RLS") || msg.includes("permission") || msg.includes("denied"))
    return { code: "forbidden",       message: "You don't have permission to do that." };
  if (msg.includes("fetch") || msg.includes("network"))
    return { code: "network_error",   message: "No connection. Check your internet." };
  if (msg.includes("invalid") || msg.includes("validation"))
    return { code: "validation_error", message: "Invalid data provided." };
  return { code: "unknown", message: "Something went wrong. Please try again." };
}
