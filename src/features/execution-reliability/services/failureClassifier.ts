import type { FailureCategory } from "../types";

/** Pure — deterministic, no side effects. */
export function classifyFailure(e: unknown): FailureCategory {
  if (e instanceof Error && e.name === "ZodError") return "validation_failure";
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate")) return "duplicate_execution";
  if (msg.includes("timeout") || msg.includes("AbortError") || msg.includes("57014")) return "timeout_failure";
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) return "network_failure";
  if (msg.includes("PGRST") || msg.includes("42") || msg.includes("db") || msg.includes("relation")) return "db_failure";
  return "unknown_failure";
}
