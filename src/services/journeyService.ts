import { supabase } from "@/lib/supabase";

const FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
  .replace(/\/$/, "") + "/functions/v1";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const journeyService = {
  async getJourney(userId: string) {
    const res = await fetch(`${FUNCTIONS_URL}/user-journey/${userId}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Journey fetch failed: ${res.status}`);
    return res.json();
  },

  async getStory(userId: string) {
    const res = await fetch(`${FUNCTIONS_URL}/user-journey/${userId}?story=true`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Story fetch failed: ${res.status}`);
    return res.json() as Promise<{ user_id: string; story: Array<{ at: string; event: string; detail: string }> }>;
  },

  /** Idempotent demo bootstrap — call on app load and on empty states. */
  async bootstrap(userId: string): Promise<void> {
    const headers = await authHeaders();
    await fetch(`${FUNCTIONS_URL}/bootstrap`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    }).catch(() => {}); // fire-and-forget — never throw
  },

  /** Instant demo Instagram connection — bypasses OAuth entirely. */
  async demoConnect(userId: string): Promise<void> {
    const headers = await authHeaders();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(
        `${FUNCTIONS_URL}/instagram-auth?action=demo&user_id=${userId}`,
        { headers, signal: controller.signal },
      );
    } catch {
      // Edge function not deployed or timed out — ignore for demo
    } finally {
      clearTimeout(timeout);
    }
  },
};
