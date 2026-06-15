import { supabase } from "@/lib/supabase";

/** Onboarding completion — sole owner of the onboarding_complete flag. */
export const onboardingService = {
  /**
   * Marks onboarding complete and confirms the write via DB round-trip.
   * Returns true only when the written row echoes onboarding_complete = true.
   */
  async markComplete(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("onboarding_complete")
      .single();
    if (error) throw error;
    return data?.onboarding_complete === true;
  },
};
