import type { IntelligenceResult } from "../types";
import { profileDLQService } from "./profileDLQService";
import { profileMaterializer } from "../materialization/profileMaterializer";

export const profileRebuilder = {
  /**
   * Replays all pending DLQ entries for a user.
   * Each rebuild clears its DLQ entry on success.
   */
  async replayForUser(userId: string): Promise<IntelligenceResult> {
    const pending = await profileDLQService.getPending(userId);
    if (!pending.length) return { success: true, data: undefined };

    const result = await profileMaterializer.materialize(userId);
    if (result.success) {
      for (const entry of pending) {
        await profileDLQService.remove(userId, entry.profileVersion);
      }
    }
    return result.success
      ? { success: true, data: undefined }
      : { success: false, error: result.error };
  },
};
