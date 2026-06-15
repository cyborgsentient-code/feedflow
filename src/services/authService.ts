import { supabase, supabaseAdmin } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void;

export const authService = {
  onAuthStateChange(callback: AuthStateCallback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },

  signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  // Uses admin client to work around GoTrue 500 bug on this Supabase account
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return { data: null, error };
    // Sign in immediately so the session is established on the regular client
    const result = await supabase.auth.signInWithPassword({ email, password });
    // Ensure profile row exists (trigger was dropped due to Supabase bug)
    if (result.data.user) {
      await supabase.from("profiles").upsert({ id: result.data.user.id }, { onConflict: "id" });
    }
    return result;
  },

  signOut() {
    return supabase.auth.signOut();
  },
};
