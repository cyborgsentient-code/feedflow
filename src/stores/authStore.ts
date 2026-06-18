import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { authService } from "@/services/authService";
import { queryClient } from "@/lib/queryClient";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  sessionKey: number;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  sessionKey: 0,

  setSession: (session) =>
    set((s) => ({
      session,
      user: session?.user ?? null,
      isLoading: false,
      // bump on every new sign-in so hooks that depend on sessionKey re-run
      sessionKey: session?.user && session.user.id !== s.user?.id ? s.sessionKey + 1 : s.sessionKey,
    })),

  signOut: async () => {
    await authService.signOut();
    queryClient.clear();
    set({ session: null, user: null, isLoading: false });
  },
}));

// If INITIAL_SESSION never fires (offline first boot), unblock the app after 5s.
setTimeout(() => {
  useAuthStore.setState((s) => (s.isLoading ? { isLoading: false } : s));
}, 5000);
