import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { intelligenceReadService } from "../services/intelligenceReadService";
import { profileMaterializer } from "../materialization/profileMaterializer";

export const PROFILE_KEY = (userId: string) => ["preference-profile", userId] as const;

const STALE_MS  = 5 * 60 * 1000;  // 5 minutes — trigger background refresh
const CACHE_MS  = 30 * 60 * 1000; // 30 minutes — keep data in React Query cache

export function usePreferenceProfile() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";
  const qc = useQueryClient();

  const query = useQuery({
    queryKey:  PROFILE_KEY(userId),
    queryFn:   async () => {
      const result = await intelligenceReadService.getProfile(userId);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled:   !!userId,
    staleTime: STALE_MS,
    gcTime:    CACHE_MS,
  });

  /** Trigger background rematerialization without blocking the current render. */
  function refreshInBackground(): void {
    profileMaterializer.materialize(userId).then(() => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY(userId) });
    });
  }

  return {
    profile:             query.data,
    loading:             query.isLoading,
    error:               query.error,
    invalidate:          () => qc.invalidateQueries({ queryKey: PROFILE_KEY(userId) }),
    refreshInBackground,
  };
}
