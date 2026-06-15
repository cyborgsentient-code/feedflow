import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { controlPlaneService } from "../services/controlPlaneService";

export function useKillSwitchState() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey:        ["kill-switch-state", user?.id],
    queryFn:         () => controlPlaneService.getKillSwitchState(),
    enabled:         !!user,
    refetchInterval: 15_000,   // faster poll — kill switches need <30s propagation
    staleTime:       10_000,
  });
}
