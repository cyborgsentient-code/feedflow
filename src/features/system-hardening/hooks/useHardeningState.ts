import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { systemShield }     from "../enforcement/systemShield";
import { hardeningMetrics } from "../telemetry/hardeningMetrics";
import { actionQuarantine } from "../enforcement/actionQuarantine";

export function useHardeningState() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey:        ["hardening-state"],
    queryFn:         () => ({
      shieldMode:       systemShield.getMode(),
      metrics:          hardeningMetrics.snapshot(),
      quarantinedCount: actionQuarantine.size(),
    }),
    enabled:         !!user,
    staleTime:       10_000,
    refetchInterval: 10_000,
  });
}
