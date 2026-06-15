import type { FailureCategory } from "../types";

/** Classify a raw error into a structured category. Pure function. */
export function classifyError(e: unknown): { category: FailureCategory; reason: string; snapshot: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const snapshot = e instanceof Error && e.stack ? e.stack.slice(0, 500) : msg.slice(0, 500);

  if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED"))
    return { category: "network_failure",         reason: "Network unreachable",      snapshot };
  if (msg.includes("timeout") || msg.includes("57014"))
    return { category: "db_timeout_failure",       reason: "DB query timeout",         snapshot };
  if (msg.includes("lock") || msg.includes("55P03"))
    return { category: "lock_acquisition_failure", reason: "Lock not acquired",        snapshot };
  if (msg.includes("rule") || msg.includes("evaluation"))
    return { category: "rule_evaluation_failure",  reason: "Rule eval error",          snapshot };
  if (msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate"))
    return { category: "duplicate_event",          reason: "Fingerprint already exists", snapshot };
  return { category: "unknown_failure", reason: msg.slice(0, 200), snapshot };
}
