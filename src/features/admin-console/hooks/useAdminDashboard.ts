import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { adminQueryService } from "../services/adminQueryService";

export function useAdminDashboard() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey:        ["admin-dashboard", userId],
    queryFn:         () => adminQueryService.systemSnapshot(userId),
    enabled:         !!userId,
    staleTime:       5_000,
    refetchInterval: 10_000,
  });
}
