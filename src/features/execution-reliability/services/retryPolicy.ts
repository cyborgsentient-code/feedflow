import type { ActionType } from "@/features/action-execution/types";

/** Max retries per action type — single source of truth. */
const RETRY_MAP: Record<ActionType, number> = {
  save_content:   0,
  create_summary: 2,
  create_draft:   2,
  notify_user:    5,
};

export function getMaxRetries(actionType: ActionType): number {
  return RETRY_MAP[actionType];
}

/** Exponential backoff: 1s, 2s, 4s … capped at 30s. */
export function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30_000);
}
