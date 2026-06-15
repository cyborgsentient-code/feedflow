import { supabase } from "@/lib/supabase";
import type { PreferenceProfile, RecommendationSignal, IntelligenceResult } from "../types";
import { mapError } from "./intelligenceErrors";
import { profileCache } from "../materialization/profileCache";
import { bumpVersion } from "../materialization/profileVersioning";
import { signalCache } from "../materialization/signalCache";

export const intelligenceWriteService = {
  async saveProfile(profile: PreferenceProfile): Promise<IntelligenceResult> {
    try {
      const existing = await profileCache.get(profile.userId);
      const version  = existing ? bumpVersion(existing.profileVersion) : profile.profileVersion;
      const versioned = { ...profile, profileVersion: version };

      const { error } = await supabase
        .from("preference_profiles")
        .upsert(
          {
            user_id:                    versioned.userId,
            source_affinity:            versioned.sourceAffinity,
            content_category_affinity:  versioned.contentCategoryAffinity,
            interaction_count:          versioned.interactionCount,
            last_updated:               versioned.lastUpdated,
            profile_version:            versioned.profileVersion,
          },
          { onConflict: "user_id" },
        );
      if (error) throw error;

      // Evict stale cached signals since profile changed
      signalCache.evict(versioned.userId);

      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async saveSignals(signals: RecommendationSignal[]): Promise<IntelligenceResult> {
    if (!signals.length) return { success: true, data: undefined };
    try {
      const { error } = await supabase
        .from("recommendation_signals")
        .upsert(
          signals.map((s) => ({
            user_id:     s.userId,
            content_id:  s.contentId,
            fingerprint: s.fingerprint,
            score:       s.score,
            components:  s.components,
            created_at:  s.createdAt,
          })),
          { onConflict: "fingerprint" },
        );
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
