import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { systemRiskService } from "../services/systemRiskService";

export function useSystemRisk() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey:        ["system-risk"],
    queryFn:         () => systemRiskService.snapshot(),
    enabled:         !!user,
    staleTime:       10_000,
    refetchInterval: 10_000,
  });
}
