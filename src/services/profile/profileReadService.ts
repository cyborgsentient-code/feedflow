import { supabase } from "@/lib/supabase";

/** Read-only profile queries. Never writes. */
export const profileReadService = {
  async getOnboardingStatus(userId: string): Promise<{ onboarding_complete: boolean }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },
};
