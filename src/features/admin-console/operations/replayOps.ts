import { systemReplayService } from "@/features/intelligence-control-plane/replay/systemReplayService";
import { replaySafetyValidator } from "@/features/intelligence-control-plane/replay/replaySafetyValidator";
import type { ReplayRequest, ReplayResult } from "@/features/intelligence-control-plane/types";
import type { ModuleType } from "@/features/intelligence-control-plane/types";

export const replayOps = {
  async trigger(
    module:    ModuleType,
    entityId:  string,
    userId:    string,
    adminId:   string,
    force:     boolean = false,
  ): Promise<ReplayResult> {
    const request: ReplayRequest = {
      id:          `admin-replay-${entityId}-${Date.now()}`,
      userId,
      module,
      entityId,
      mode:        force ? "execute" : "execute",
      requestedAt: new Date().toISOString(),
    };

    // Safety always runs, even for SUPER_ADMIN (force only bypasses idempotency, not kill switch)
    if (!force) {
      const safety = await replaySafetyValidator.validate(request, userId);
      if (!safety.safe) {
        return { requestId: request.id, action: "blocked_by_kill_switch", details: safety.reason };
      }
    }

    return systemReplayService.replay(request, userId);
  },
};
