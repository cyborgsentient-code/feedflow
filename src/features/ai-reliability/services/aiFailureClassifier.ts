import type { AIFailureCategory } from "../types";

/** Pure — deterministic, no side effects. */
export function classifyAIFailure(e: unknown): AIFailureCategory {
  if (e instanceof Error && e.name === "ZodError") return "validation_failure";
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("budget") || msg.includes("limit_exceeded"))   return "budget_exceeded";
  if (msg.includes("timeout") || msg.includes("AbortError"))      return "timeout_failure";
  if (msg.includes("fetch") || msg.includes("network"))           return "network_failure";
  if (msg.includes("provider") || msg.includes("model"))          return "provider_failure";
  if (msg.includes("23505") || msg.includes("duplicate"))         return "duplicate_job";
  if (msg.includes("PGRST") || msg.includes("relation"))          return "db_failure";
  return "unknown_failure";
}
