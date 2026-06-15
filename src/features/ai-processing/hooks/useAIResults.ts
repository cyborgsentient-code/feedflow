import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { aiReadService } from "../services/aiReadService";

const KEYS = {
  results: (userId: string) => ["ai-results", userId] as const,
  result:  (id: string)     => ["ai-result",  id]     as const,
};

export function useAIResults() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.results(user?.id ?? ""),
    queryFn:  async () => {
      const r = await aiReadService.getUserResults(user!.id);
      if (!r.success) throw new Error(r.error.message);
      return r.data;
    },
    enabled: !!user,
  });
}

export function useAIResult(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.result(id),
    queryFn:  async () => {
      const r = await aiReadService.getAIJob(id, user!.id);
      if (!r.success) throw new Error(r.error.message);
      return r.data;
    },
    enabled: !!id && !!user,
  });
}
