import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { queueHealthService } from "../../automation-observability/services/queueHealthService";

export function useQueueHealth() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["queue-health", user?.id],
    queryFn:  () => queueHealthService.compute(user?.id),
    enabled:  !!user,
    refetchInterval: 30_000,
  });
}
