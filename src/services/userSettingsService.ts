import { supabase } from "@/lib/supabase";
import type { UserSettings } from "@/types/database";

export const userSettingsService = {
  async getOrCreate(userId: string): Promise<UserSettings> {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) return data;

    // First login — create default row
    const { data: created, error: insertErr } = await supabase
      .from("user_settings")
      .insert({ user_id: userId })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return created;
  },

  async setAutomationEnabled(userId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: userId, automation_enabled: enabled, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw error;
  },
};
