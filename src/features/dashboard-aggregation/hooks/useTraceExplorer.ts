import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { traceExplorerService } from "../dashboard/traceExplorerService";
import type { TraceFilter } from "../types";

export function useTraceExplorer(filter?: TraceFilter) {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey:  ["trace-explorer", userId, filter],
    queryFn:   () => {
      if (filter?.entityId) {
        return traceExplorerService.getChain(filter.entityId, userId, filter) ?? [];
      }
      return traceExplorerService.getTimeline(userId, filter);
    },
    enabled:   !!userId,
    staleTime: 10_000,
  });
}
