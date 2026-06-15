import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { intelligenceReadService } from "../services/intelligenceReadService";
import { signalCache } from "../materialization/signalCache";

export const SIGNALS_KEY = (userId: string) => ["recommendation-signals", userId] as const;

const STALE_MS = 10 * 60 * 1000; // matches signalCache threshold
const CACHE_MS = 30 * 60 * 1000;

export function useRecommendationSignals(profileVersion?: number) {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";
  const qc = useQueryClient();

  const query = useQuery({
    queryKey:  SIGNALS_KEY(userId),
    queryFn:   async () => {
      // Return memory-cached signals if profileVersion matches and not stale
      if (profileVersion !== undefined) {
        const cached = signalCache.get(userId, profileVersion);
        if (cached) return cached;
      }
      const result = await intelligenceReadService.getSignals(userId);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled:   !!userId,
    staleTime: STALE_MS,
    gcTime:    CACHE_MS,
  });

  return {
    signals:    query.data ?? [],
    loading:    query.isLoading,
    error:      query.error,
    invalidate: () => qc.invalidateQueries({ queryKey: SIGNALS_KEY(userId) }),
  };
}
