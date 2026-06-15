import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { automationReadService } from "../services/automationReadService";
import { automationWriteService } from "../services/automationWriteService";
import type { AutomationCreateValues, AutomationUpdateValues } from "../validators";

export const KEYS = {
  list:    (userId: string) => ["automations", userId] as const,
  detail:  (id: string)     => ["automation", id] as const,
  history: (id: string)     => ["automation-history", id] as const,
};

export function useAutomations() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.list(user?.id ?? ""),
    queryFn: async () => {
      const result = await automationReadService.getAutomations(user!.id);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!user,
  });
}

export function useAutomation(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const result = await automationReadService.getAutomation(id, user!.id);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!id && !!user,
  });
}

export function useExecutionHistory(automationId: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.history(automationId),
    queryFn: async () => {
      const result = await automationReadService.getExecutionHistory(automationId, user!.id);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!automationId && !!user,
  });
}

// H2: create goes through useMutation — React Query enforces single-flight
export function useCreateAutomation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (values: AutomationCreateValues) =>
      automationWriteService.createAutomation(user!.id, values),
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      automationWriteService.toggleAutomation(id, user!.id, enable),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (id: string) => automationWriteService.deleteAutomation(id, user!.id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: KEYS.detail(id) });
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}

export function useUpdateAutomation(id: string) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (values: AutomationUpdateValues) =>
      automationWriteService.updateAutomation(id, user!.id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}
