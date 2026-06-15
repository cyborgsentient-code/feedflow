import { supabase } from "@/lib/supabase";
import type { PreferenceProfile, RecommendationSignal, IntelligenceResult } from "../types";
import { mapError } from "./intelligenceErrors";

export const intelligenceReadService = {
  async getProfile(userId: string): Promise<IntelligenceResult<PreferenceProfile>> {
    try {
      const { data, error } = await supabase
        .from("preference_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return {
        success: true,
        data: {
          userId:                  String(data.user_id),
          sourceAffinity:          (data.source_affinity as Record<string, number>) ?? {},
          contentCategoryAffinity: (data.content_category_affinity as Record<string, number>) ?? {},
          interactionCount:        Number(data.interaction_count ?? 0),
          lastUpdated:             String(data.last_updated),
          profileVersion:          Number(data.profile_version ?? 1),
        },
      };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },

  async getSignals(userId: string): Promise<IntelligenceResult<RecommendationSignal[]>> {
    try {
      const { data, error } = await supabase
        .from("recommendation_signals")
        .select("*")
        .eq("user_id", userId)
        .order("score", { ascending: false })
        .limit(100);
      if (error) throw error;
      return {
        success: true,
        data: (data ?? []).map((r) => ({
          userId:      String(r.user_id),
          contentId:   String(r.content_id),
          fingerprint: String(r.fingerprint),
          score:       Number(r.score),
          components:  (r.components as RecommendationSignal["components"]),
          createdAt:   String(r.created_at),
        })),
      };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
