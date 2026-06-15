import type { AITokenEstimate, AICostEstimate } from "../types";
import { MODELS } from "./modelRegistry";

export function estimateCost(modelId: string, tokens: AITokenEstimate): AICostEstimate {
  const model = MODELS[modelId];
  if (!model) return { modelId, estimatedCostUsd: 0 };
  const usd = (tokens.estimatedInputTokens  / 1000) * model.inputCostPer1k
            + (tokens.estimatedOutputTokens / 1000) * model.outputCostPer1k;
  return { modelId, estimatedCostUsd: Math.round(usd * 1_000_000) / 1_000_000 };
}
