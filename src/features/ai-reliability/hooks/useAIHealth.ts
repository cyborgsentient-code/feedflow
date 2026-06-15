import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { aiHealthService } from "../services/aiHealthService";

export function useAIHealth() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey:       ["ai-health", user?.id],
    queryFn:        () => aiHealthService.compute(user!.id),
    enabled:        !!user,
    refetchInterval: 30_000,
  });
}
