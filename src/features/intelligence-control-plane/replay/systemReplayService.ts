import type { ReplayRequest, ReplayResult } from "../types";
import { replaySafetyValidator } from "./replaySafetyValidator";
import { moduleRegistry } from "../registry/moduleRegistry";

/**
 * Per-module replay delegates — each calls the appropriate existing DLQ/replay service.
 * Import only types here; actual replay is delegated to the module's own replay service.
 */
export const systemReplayService = {
  async replay(request: ReplayRequest, callerUserId: string): Promise<ReplayResult> {
    // Safety validation: ownership + kill switch + policy
    const safety = await replaySafetyValidator.validate(request, callerUserId);
    if (!safety.safe) {
      return { requestId: request.id, action: "blocked_by_kill_switch", details: safety.reason };
    }

    if (!moduleRegistry.isReplayable(request.module)) {
      return { requestId: request.id, action: "skipped", details: `Module '${request.module}' is not replayable.` };
    }

    if (request.mode === "dry-run") {
      return { requestId: request.id, action: "skipped", details: "dry-run mode — no state changes." };
    }

    // Delegate to the module's own replay infrastructure
    // This avoids importing Supabase directly here and keeps each module self-contained.
    try {
      const handler = await resolveReplayHandler(request.module);
      await handler(request.entityId, request.userId);
      return { requestId: request.id, action: "replayed" };
    } catch (e) {
      return {
        requestId: request.id,
        action:    "skipped",
        details:   e instanceof Error ? e.message : String(e),
      };
    }
  },
};

type ReplayHandler = (entityId: string, userId: string) => Promise<void>;

async function resolveReplayHandler(module: string): Promise<ReplayHandler> {
  switch (module) {
    case "automation": {
      const { replayService } = await import("@/features/automation-recovery/services/replayService");
      return (entityId, userId) => replayService.replayJob(entityId, userId);
    }
    case "execution": {
      const { executionReplayService } = await import("@/features/execution-reliability/services/executionReplayService");
      return (entityId, userId) => executionReplayService.replayExecution(entityId, userId);
    }
    case "ai": {
      const { aiReplayService } = await import("@/features/ai-reliability/services/aiReplayService");
      return (entityId, userId) => aiReplayService.replayJob(entityId, userId).then(() => undefined);
    }
    case "intelligence": {
      const { profileRebuilder } = await import("@/features/user-intelligence/reliability/profileRebuilder");
      return (_entityId, userId) => profileRebuilder.replayForUser(userId).then(() => undefined);
    }
    default:
      throw new Error(`No replay handler registered for module: ${module}`);
  }
}
