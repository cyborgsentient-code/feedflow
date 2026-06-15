import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { executionReadService } from "../services/executionReadService";

const KEYS = {
  result:  (id: string)     => ["execution-result", id] as const,
  results: (userId: string) => ["execution-results", userId] as const,
};

export function useExecutionResult(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.result(id),
    queryFn: async () => {
      const r = await executionReadService.getExecutionResult(id, user!.id);
      if (!r.success) throw new Error(r.error.message);
      return r.data;
    },
    enabled: !!id && !!user,
  });
}

export function useUserExecutionResults() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.results(user?.id ?? ""),
    queryFn: async () => {
      const r = await executionReadService.getUserExecutionResults(user!.id);
      if (!r.success) throw new Error(r.error.message);
      return r.data;
    },
    enabled: !!user,
  });
}
