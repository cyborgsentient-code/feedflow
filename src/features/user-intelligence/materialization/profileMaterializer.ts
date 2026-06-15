import { supabase } from "@/lib/supabase";
import type { IntelligenceResult, PreferenceProfileSnapshot } from "../types";
import { preferenceProfileService } from "../services/preferenceProfileService";
import { profileCache } from "./profileCache";
import { profileRetryPolicy } from "../reliability/profileRetryPolicy";
import { profileDLQService } from "../reliability/profileDLQService";
import { profileTraceCollector } from "../reliability/profileTraceCollector";
import { computeProfileHash, snapshotFromProfile } from "./profileVersioning";

export const profileMaterializer = {
  /**
   * Build + persist a materialized snapshot.
   * Retries up to 3×, writes failures to DLQ.
   * Never throws — always returns IntelligenceResult.
   */
  async materialize(userId: string): Promise<IntelligenceResult<PreferenceProfileSnapshot>> {
    const traceId = profileTraceCollector.startProfileBuild(userId);

    const result = await profileRetryPolicy.execute(async () => {
      const buildResult = await preferenceProfileService.buildProfile(userId);
      if (!buildResult.success) throw new Error(buildResult.error.message);
      return buildResult.data;
    });

    if (!result.success) {
      profileTraceCollector.failProfileBuild(traceId, result.error);
      await profileDLQService.record({
        userId,
        profileVersion: 0,
        failureCategory: result.failureCategory,
        errorMessage:    result.error,
        retryCount:      result.attempts,
      });
      return { success: false, error: { code: "unknown", message: result.error } };
    }

    const profile = result.data;

    // Fetch last interaction id for version hash
    const { data: lastIx } = await supabase
      .from("user_interactions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const hash     = await computeProfileHash(userId, lastIx?.id ?? "", profile.interactionCount);
    const snapshot = snapshotFromProfile(profile, hash);

    await profileCache.set(snapshot);
    profileTraceCollector.finishProfileBuild(traceId);

    return { success: true, data: snapshot };
  },
};
