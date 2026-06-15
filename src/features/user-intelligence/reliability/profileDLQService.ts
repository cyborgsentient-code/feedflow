import { supabase } from "@/lib/supabase";
import type { ProfileDLQEntry, ProfileFailureCategory } from "../types";

export const profileDLQService = {
  async record(entry: Omit<ProfileDLQEntry, "lastAttemptAt">): Promise<void> {
    await supabase
      .from("profile_dlq")
      .upsert(
        {
          user_id:          entry.userId,
          profile_version:  entry.profileVersion,
          failure_category: entry.failureCategory,
          error_message:    entry.errorMessage,
          retry_count:      entry.retryCount,
          last_attempt_at:  new Date().toISOString(),
        },
        { onConflict: "user_id,profile_version" },
      );
    // Fire-and-forget — never throw
  },

  async getPending(userId: string): Promise<ProfileDLQEntry[]> {
    const { data } = await supabase
      .from("profile_dlq")
      .select("*")
      .eq("user_id", userId)
      .order("last_attempt_at", { ascending: false });
    return (data ?? []).map((r) => ({
      userId:          String(r.user_id),
      profileVersion:  Number(r.profile_version),
      failureCategory: r.failure_category as ProfileFailureCategory,
      errorMessage:    String(r.error_message),
      retryCount:      Number(r.retry_count),
      lastAttemptAt:   String(r.last_attempt_at),
    }));
  },

  async remove(userId: string, profileVersion: number): Promise<void> {
    await supabase
      .from("profile_dlq")
      .delete()
      .eq("user_id", userId)
      .eq("profile_version", profileVersion);
  },
};
