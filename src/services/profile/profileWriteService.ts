import { supabase } from "@/lib/supabase";

/** Write-only profile mutations. Never reads realtime streams. */
export const profileWriteService = {
  async updateProfile(userId: string, updates: { interests?: string[]; display_name?: string }) {
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;
  },

  /**
   * Upsert user_preferences rows from interest slugs.
   * Looks up category IDs, replaces all existing preferences for the user.
   * Called during onboarding completion — this is the source of truth the
   * automation loop and user-journey API read from.
   */
  async saveInterestPreferences(userId: string, slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;

    const { data: categories, error: catErr } = await supabase
      .from("interest_categories")
      .select("id, slug")
      .in("slug", slugs);
    if (catErr) throw catErr;

    // Delete existing preferences first (replace semantics)
    await supabase.from("user_preferences").delete().eq("user_id", userId);

    if (!categories?.length) return;

    const rows = categories.map((cat, i) => ({
      user_id:     userId,
      category_id: cat.id,
      // Weight descends by selection order (first selected = highest weight)
      weight:      1 - (i / categories.length) * 0.5,
    }));

    const { error: insertErr } = await supabase.from("user_preferences").insert(rows);
    if (insertErr) throw insertErr;
  },
};
