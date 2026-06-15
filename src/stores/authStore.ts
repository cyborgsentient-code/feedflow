import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { authService } from "@/services/authService";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  signOut: async () => {
    await authService.signOut();
    set({ session: null, user: null, isLoading: false });
  },
}));

// If INITIAL_SESSION never fires (offline first boot), unblock the app after 5s.
setTimeout(() => {
  useAuthStore.setState((s) => (s.isLoading ? { isLoading: false } : s));
}, 5000);
