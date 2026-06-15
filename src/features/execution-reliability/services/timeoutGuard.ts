import type { ActionType } from "@/features/action-execution/types";

const TIMEOUT_MAP: Record<ActionType, number> = {
  save_content:   5_000,
  create_summary: 30_000,
  create_draft:   30_000,
  notify_user:    10_000,
};

export function getTimeoutMs(actionType: ActionType): number {
  return TIMEOUT_MAP[actionType];
}

/**
 * Race a promise against a timeout.
 * On timeout throws an Error with "timeout" in the message
 * so classifyFailure maps it to "timeout_failure".
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}
