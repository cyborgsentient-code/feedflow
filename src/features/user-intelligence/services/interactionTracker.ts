import { supabase } from "@/lib/supabase";
import type { UserInteraction, IntelligenceResult } from "../types";
import { userInteractionSchema } from "../validators";
import { mapError } from "./intelligenceErrors";

export const interactionTracker = {
  async recordInteraction(
    input: Omit<UserInteraction, "id" | "createdAt">,
  ): Promise<IntelligenceResult> {
    const parsed = userInteractionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: { code: "validation_failed", message: parsed.error.issues[0]?.message ?? "Invalid." } };
    }
    try {
      const { error } = await supabase.from("user_interactions").insert({
        user_id:     input.userId,
        content_id:  input.contentId,
        source_id:   input.sourceId,
        interaction: input.interaction,
      });
      if (error) throw error;
      return { success: true, data: undefined };
    } catch (e) {
      return { success: false, error: mapError(e) };
    }
  },
};
