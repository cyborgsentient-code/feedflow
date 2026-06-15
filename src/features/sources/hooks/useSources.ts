import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { sourceReadService } from "../services/sourceReadService";
import { sourceWriteService } from "../services/sourceWriteService";
import type { SourceCreateValues } from "../validators";
import type { SourceStatus } from "../types";

export const KEYS = {
  list:   (userId: string) => ["sources", userId] as const,
  detail: (id: string)     => ["source", id] as const,
};

export function useSources() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.list(user?.id ?? ""),
    queryFn: async () => {
      const result = await sourceReadService.getSources(user!.id);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!user,
  });
}

export function useSource(id: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const result = await sourceReadService.getSource(id, user!.id);
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateSource() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (values: SourceCreateValues) =>
      sourceWriteService.createSource(user!.id, values),
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}

export function useSetSourceStatus() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SourceStatus }) =>
      sourceWriteService.setSourceStatus(id, user!.id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}

export function useDeleteSource() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (id: string) => sourceWriteService.deleteSource(id, user!.id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: KEYS.detail(id) });
      if (user) qc.invalidateQueries({ queryKey: KEYS.list(user.id) });
    },
  });
}
