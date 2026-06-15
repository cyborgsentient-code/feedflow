import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { aiReplayService, type ReplayMode } from "../services/aiReplayService";
import type { AIFailureCategory } from "../types";

export function useAIReplay() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ai-health",   user?.id] });
    qc.invalidateQueries({ queryKey: ["ai-results",  user?.id] });
  };

  const replayJob = useMutation({
    mutationFn: ({ fingerprint, mode }: { fingerprint: string; mode?: ReplayMode }) =>
      aiReplayService.replayJob(fingerprint, user!.id, mode),
    onSuccess: invalidate,
  });

  const replayByCategory = useMutation({
    mutationFn: ({ category, mode }: { category: AIFailureCategory; mode?: ReplayMode }) =>
      aiReplayService.replayByCategory(category, user!.id, mode),
    onSuccess: invalidate,
  });

  const replayAllFailed = useMutation({
    mutationFn: ({ mode }: { mode?: ReplayMode } = {}) => aiReplayService.replayAllFailed(user!.id, mode),
    onSuccess: invalidate,
  });

  return { replayJob, replayByCategory, replayAllFailed };
}
