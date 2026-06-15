import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";

export function useAuth() {
  const { session, user, isLoading } = useAuthStore();

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signIn: authService.signInWithEmail,
    signUp: authService.signUpWithEmail,
    signOut: authService.signOut,
  };
}
