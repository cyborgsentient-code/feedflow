import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { executionHealthService } from "../services/executionHealthService";

export function useExecutionHealth() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["execution-health", user?.id],
    queryFn:  () => executionHealthService.compute(user!.id),
    enabled:  !!user,
    refetchInterval: 30_000,
  });
}
