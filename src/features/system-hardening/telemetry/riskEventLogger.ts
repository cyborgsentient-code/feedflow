import type { HardeningDecision } from "../types";

/** In-memory append-only ring buffer of risk events (last 1000). */
const log: Array<{ userId: string; decision: HardeningDecision; ts: string }> = [];
const MAX = 1000;

export const riskEventLogger = {
  append(userId: string, decision: HardeningDecision): void {
    if (log.length >= MAX) log.shift();
    log.push({ userId, decision, ts: new Date().toISOString() });
  },

  recent(n = 50) {
    return log.slice(-n);
  },

  forUser(userId: string) {
    return log.filter((e) => e.userId === userId);
  },
};
