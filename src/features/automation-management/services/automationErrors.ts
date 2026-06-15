import type { AutomationServiceError } from "../types";

export function mapError(e: unknown): AutomationServiceError {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not found") || msg.includes("PGRST116"))
    return { code: "not_found",    message: "Automation not found." };
  if (msg.includes("403") || msg.includes("RLS") || msg.includes("permission") || msg.includes("denied"))
    return { code: "forbidden",    message: "You don't have permission to do that." };
  if (msg.includes("fetch") || msg.includes("network"))
    return { code: "network_error", message: "No connection. Check your internet." };
  return { code: "unknown", message: "Something went wrong. Please try again." };
}
