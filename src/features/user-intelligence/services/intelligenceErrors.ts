import type { IntelligenceServiceError } from "../types";

export function mapError(e: unknown): IntelligenceServiceError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not found") || msg.includes("PGRST116"))
    return { code: "not_found",         message: "Record not found." };
  if (msg.includes("403") || msg.includes("RLS") || msg.includes("permission"))
    return { code: "forbidden",         message: "You don't have permission." };
  if (msg.includes("invalid") || msg.includes("validation"))
    return { code: "validation_failed", message: "Invalid data." };
  if (msg.includes("fetch") || msg.includes("network"))
    return { code: "network_error",     message: "No connection." };
  return { code: "unknown", message: "Something went wrong. Please try again." };
}
