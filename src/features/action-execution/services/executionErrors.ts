import type { ExecutionServiceError } from "../types";

export function mapError(e: unknown): ExecutionServiceError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not found") || msg.includes("PGRST116"))
    return { code: "not_found",         message: "Execution not found." };
  if (msg.includes("403") || msg.includes("RLS") || msg.includes("permission") || msg.includes("denied"))
    return { code: "forbidden",         message: "You don't have permission." };
  if (msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate"))
    return { code: "duplicate",         message: "Already executed." };
  if (msg.includes("invalid") || msg.includes("validation"))
    return { code: "validation_failed", message: "Invalid execution payload." };
  if (msg.includes("fetch") || msg.includes("network"))
    return { code: "network_error",     message: "No connection. Check your internet." };
  return { code: "unknown", message: "Something went wrong. Please try again." };
}
