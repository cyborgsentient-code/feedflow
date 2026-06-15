import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { userDashboardService } from "../dashboard/userDashboardService";
import { widgetComposer } from "../dashboard/widgetComposer";
import type { TimeWindow } from "../types";

export function useUserDashboard(window: TimeWindow = "1h") {
  const { user } = useAuthStore();
  const userId = user?.id ?? "";

  return useQuery({
    queryKey:  ["user-dashboard", userId, window],
    queryFn:   async () => {
      const state   = await userDashboardService.build(userId, window);
      const widgets = widgetComposer.forUser(state, window);
      return { state, widgets };
    },
    enabled:   !!userId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
