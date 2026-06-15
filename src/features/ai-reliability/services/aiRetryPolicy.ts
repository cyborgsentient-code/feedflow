import type { AITaskType } from "@/features/ai-processing/types";

const MAX_RETRIES: Record<AITaskType, number> = {
  summary:                2,
  extract_topics:         2,
  extract_keywords:       2,
  sentiment_analysis:     2,
  content_classification: 2,
  entity_extraction:      2,
  draft_caption:          3,
  draft_post:             3,
};

export function getMaxRetries(taskType: AITaskType): number { return MAX_RETRIES[taskType]; }

/** Exponential backoff capped at 30s. */
export function getRetryDelay(attempt: number): number { return Math.min(1000 * 2 ** attempt, 30_000); }
