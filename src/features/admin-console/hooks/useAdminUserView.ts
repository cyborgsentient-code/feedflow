import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { adminQueryService } from "../services/adminQueryService";

export function useAdminUserView(targetUserId: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey:  ["admin-user-view", targetUserId],
    queryFn:   () => adminQueryService.userView(targetUserId),
    enabled:   !!user && !!targetUserId,
    staleTime: 30_000,
  });
}
