import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { controlPlaneService } from "../services/controlPlaneService";

export function useSystemHealth() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey:        ["system-health", user?.id],
    queryFn:         () => controlPlaneService.refreshHealth(user!.id),
    enabled:         !!user,
    refetchInterval: 30_000,
    staleTime:       20_000,
  });
}
