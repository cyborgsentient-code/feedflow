import type { AutomationEngineError } from "../types";

export function mapEngineError(e: unknown): AutomationEngineError {
  if (e && typeof e === "object" && "code" in e) return e as AutomationEngineError;
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("evaluation") || msg.includes("rule"))
    return { code: "rule_evaluation_failed", message: "Rule evaluation failed." };
  if (msg.includes("emit"))
    return { code: "emit_failed",            message: "Event emit failed." };
  if (msg.includes("queue"))
    return { code: "queue_full",             message: "Execution queue is full." };
  return { code: "unknown", message: "Engine error. Event dropped safely." };
}
