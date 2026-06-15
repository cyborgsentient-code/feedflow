import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { executionReplayService, type ReplayMode } from "../services/executionReplayService";
import type { FailureCategory } from "../types";

export function useReplayExecutions() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["execution-health", user?.id] });
    qc.invalidateQueries({ queryKey: ["execution-results", user?.id] });
  };

  const replayExecution = useMutation({
    mutationFn: ({ executionId, mode }: { executionId: string; mode?: ReplayMode }) =>
      executionReplayService.replayExecution(executionId, user!.id, mode),
    onSuccess: invalidate,
  });

  const replayByCategory = useMutation({
    mutationFn: ({ category, mode }: { category: FailureCategory; mode?: ReplayMode }) =>
      executionReplayService.replayByCategory(category, user!.id, mode),
    onSuccess: invalidate,
  });

  const replayAllFailed = useMutation({
    mutationFn: ({ mode }: { mode?: ReplayMode } = {}) =>
      executionReplayService.replayAllFailed(user!.id, mode),
    onSuccess: invalidate,
  });

  return { replayExecution, replayByCategory, replayAllFailed };
}
