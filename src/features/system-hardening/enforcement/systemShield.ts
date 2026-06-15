import type { ShieldMode } from "../types";

let mode: ShieldMode = "OFF";

export const systemShield = {
  getMode(): ShieldMode { return mode; },
  activate(m: ShieldMode): void { mode = m; },
  deactivate(): void { mode = "OFF"; },

  reject(reason: string) {
    return { action: "block" as const, riskScore: 100, triggeredSignals: ["systemShield"], reason };
  },

  isWriteBlocked(): boolean {
    return mode === "GLOBAL_BLOCK" || mode === "READ_ONLY_MODE";
  },

  isFullyBlocked(): boolean {
    return mode === "GLOBAL_BLOCK";
  },

  /** THROTTLE_ONLY_MODE: writes and replays pass, but callers must apply a delay. */
  isThrottleOnly(): boolean {
    return mode === "THROTTLE_ONLY_MODE";
  },
};
