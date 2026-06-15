import type { SystemEvent, SystemEventType, ModuleType } from "../types";
import { globalTraceCollector } from "../tracing/globalTraceCollector";
import { killSwitchState } from "../kill-switch/killSwitchState";
import { policyEngine } from "../policies/policyEngine";

async function buildFingerprint(module: string, type: string, entityId: string, userId: string): Promise<string> {
  const input = [module, type, entityId, userId].join("|");
  const buf   = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

let _seq = 0;
function newId(): string {
  return `evt-${Date.now()}-${++_seq}`;
}

export const systemEventRouter = {
  /**
   * Receive a raw event from any module.
   * 1. Attach fingerprint
   * 2. Check kill switch — if active action blocks writes, drop the event
   * 3. Apply policy engine — if denied, drop the event
   * 4. Route to globalTraceCollector
   */
  async route(
    input: Omit<SystemEvent, "id" | "fingerprint">,
  ): Promise<{ accepted: boolean; reason?: string }> {
    // Kill switch gate
    const ksAction = killSwitchState.getAction(input.module);
    if (ksAction === "disable_ingestion" && input.module === "feed") {
      return { accepted: false, reason: `Kill switch: ${ksAction}` };
    }
    if (ksAction === "disable_execution" && input.module === "execution") {
      return { accepted: false, reason: `Kill switch: ${ksAction}` };
    }
    if (ksAction === "read_only_mode") {
      // Allow read events, block writes
      const isWrite = input.type.endsWith("_created") || input.type.endsWith("_triggered") || input.type.endsWith("_started");
      if (isWrite) return { accepted: false, reason: `Kill switch: read_only_mode on ${input.module}` };
    }

    const fingerprint = await buildFingerprint(input.module, input.type, input.entityId, input.userId);
    const event: SystemEvent = { id: newId(), fingerprint, ...input };

    // Policy gate
    const decision = await policyEngine.evaluate(event);
    if (!decision.allowed) {
      return { accepted: false, reason: decision.reason };
    }

    globalTraceCollector.record(event);
    return { accepted: true };
  },

  /** Convenience: emit without caring about the result (fire-and-forget). */
  emit(input: Omit<SystemEvent, "id" | "fingerprint">): void {
    this.route(input).catch(() => { /* best-effort */ });
  },
};
