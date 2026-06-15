import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { traceQueryService } from "../tracing/traceQueryService";
import type { ModuleType } from "../types";

export function useModuleTrace(entityId?: string, module?: ModuleType) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["module-trace", user?.id, entityId, module],
    queryFn: () => {
      if (entityId) return traceQueryService.getChain(entityId);
      if (module)   return traceQueryService.getByModule(user!.id, module);
      return traceQueryService.getUserTimeline(user!.id);
    },
    enabled:   !!user,
    staleTime: 10_000,
  });
}
