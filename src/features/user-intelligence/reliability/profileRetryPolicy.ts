import type { ProfileFailureCategory } from "../types";

type RetryResult<T> =
  | { success: true;  data: T; attempts: number }
  | { success: false; error: string; attempts: number; failureCategory: ProfileFailureCategory };

function classifyError(msg: string): ProfileFailureCategory {
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("PGRST"))
    return "db_failure";
  if (msg.includes("compute") || msg.includes("affinity"))
    return "compute_failure";
  if (msg.includes("cache"))
    return "cache_failure";
  return "unknown_failure";
}

export const profileRetryPolicy = {
  /**
   * Run fn with up to 3 attempts and exponential backoff (500ms, 1000ms, 2000ms).
   * Non-blocking — uses setTimeout-based delays.
   */
  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    const MAX_ATTEMPTS = 3;
    let lastError = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const data = await fn();
        return { success: true, data, attempts: attempt };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }

    return {
      success:         false,
      error:           lastError,
      attempts:        MAX_ATTEMPTS,
      failureCategory: classifyError(lastError),
    };
  },
};
