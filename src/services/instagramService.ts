import { supabase } from "@/lib/supabase";
import type { InstagramConnection } from "@/types/database";

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
  .replace(/\/$/, "") + "/functions/v1";

export const instagramService = {
  /** Fetch connection row from DB — source of truth for connection status. */
  async getConnection(userId: string): Promise<InstagramConnection | null> {
    const { data } = await supabase
      .from("instagram_connections")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data ?? null;
  },

  /**
   * Initiate OAuth: calls edge function which returns the Instagram auth URL.
   * The edge function also marks status = 'connecting' in DB.
   */
  async initiateOAuth(userId: string): Promise<{ authUrl: string }> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(
        `${FUNCTIONS_URL}/instagram-auth?action=connect&user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal },
      );
      if (!res.ok) throw new Error(`Failed to initiate OAuth: ${res.status}`);
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  },

  /** Subscribe to realtime changes on this user's instagram_connections row. */
  subscribe(userId: string, onChange: (row: InstagramConnection) => void) {
    const channel = supabase
      .channel(`ig:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instagram_connections", filter: `user_id=eq.${userId}` },
        (payload) => onChange(payload.new as InstagramConnection),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};
