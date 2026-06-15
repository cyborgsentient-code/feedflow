import { supabase } from "@/lib/supabase";
import type { PreferenceProfile, IntelligenceResult } from "../types";
import { calculateSourceAffinity } from "./affinityCalculator";
import { mapError } from "./intelligenceErrors";
import { profileCache } from "../materialization/profileCache";
import { bumpVersion, hasSignificantAffinityShift } from "../materialization/profileVersioning";

export const preferenceProfileService = {
  async buildProfile(userId: string): Promise<IntelligenceResult<PreferenceProfile>> {
    try {
      const { data: interactions, error } = await supabase
        .from("user_interactions")
        .select("source_id, interaction, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;

      const rows = interactions ?? [];

      const bySource: Record<string, { interaction: string; created_at: string }[]> = {};
      for (const r of rows) {
        const sid = String(r.source_id);
        if (!bySource[sid]) bySource[sid] = [];
        bySource[sid]!.push({ interaction: r.interaction, created_at: r.created_at });
      }

      const sourceAffinity: Record<string, number> = {};
      for (const [sid, ixs] of Object.entries(bySource)) {
        sourceAffinity[sid] = calculateSourceAffinity(
          ixs as { interaction: import("../types").InteractionType; created_at: string }[],
        );
      }

      await supabase
        .from("saved_content")
        .select("content_id")
        .eq("user_id", userId)
        .limit(200);

      // Resolve version: bump if snapshot exists and affinity shifted significantly
      const existing      = await profileCache.get(userId);
      const prevAffinity  = existing?.sourceAffinity ?? {};
      const prevVersion   = existing?.profileVersion ?? 0;
      const profileVersion = hasSignificantAffinityShift(prevAffinity, sourceAffinity)
        ? bumpVersion(prevVersion)
        : prevVersion || 1;

      const profile: PreferenceProfile = {
        userId,
        sourceAffinity,
        contentCategoryAffinity: {},
        interactionCount:        rows.length,
        lastUpdated:             new Date().toISOString(),
        profileVersion,
      };

      return { success: true, data: profile };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
