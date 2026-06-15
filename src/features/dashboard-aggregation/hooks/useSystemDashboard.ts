import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { systemDashboardService } from "../dashboard/systemDashboardService";
import { widgetComposer } from "../dashboard/widgetComposer";

export function useSystemDashboard() {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey:        ["system-dashboard", userId],
    queryFn:         async () => {
      const overview = await systemDashboardService.build(userId);
      const widgets  = widgetComposer.forSystem(overview);
      return { overview, widgets };
    },
    enabled:         !!userId,
    staleTime:       20_000,
    refetchInterval: 30_000,
  });
}
