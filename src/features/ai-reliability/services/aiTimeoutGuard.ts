import type { AITaskType } from "@/features/ai-processing/types";

const TIMEOUTS_MS: Record<AITaskType, number> = {
  summary:                30_000,
  extract_topics:         15_000,
  extract_keywords:       15_000,
  sentiment_analysis:     15_000,
  content_classification: 15_000,
  entity_extraction:      15_000,
  draft_caption:          45_000,
  draft_post:             60_000,
};

export function getAITimeoutMs(taskType: AITaskType): number { return TIMEOUTS_MS[taskType]; }

export function withAITimeout<T>(promise: Promise<T>, taskType: AITaskType): Promise<T> {
  const ms = TIMEOUTS_MS[taskType];
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}
