import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { adminQueryService } from "../services/adminQueryService";
import type { AdminTraceFilter } from "../inspection/traceInspector";

export function useAdminTraces(filter: AdminTraceFilter = {}) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey:  ["admin-traces", filter],
    queryFn:   () => adminQueryService.traces(filter),
    enabled:   !!user,
    staleTime: 10_000,
  });
}
