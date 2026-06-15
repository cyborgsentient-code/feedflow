import type { AITaskType } from "@/features/ai-processing/types";
import type { AITokenEstimate, AIRouteDecision } from "../types";
import { MODELS } from "./modelRegistry";

export function routeTask(params: {
  taskType:        AITaskType;
  tokenEstimate:   AITokenEstimate;
  budgetRemaining: number;
  modelPreference?: string;
}): AIRouteDecision {
  const { modelPreference, budgetRemaining } = params;

  // Preferred model if supplied and affordable
  if (modelPreference && MODELS[modelPreference]) {
    const model = MODELS[modelPreference]!;
    const cost  = estimateCostForModel(model.id, params.tokenEstimate);
    if (cost <= budgetRemaining) {
      return { provider: model.providerId, model: model.id, reason: "preferred_model" };
    }
  }

  // Budget exceeded — fall back to mock
  if (budgetRemaining <= 0) {
    return { provider: "MOCK", model: "mock-model", reason: "budget_exhausted" };
  }

  // Default: cheapest capable model
  const cheapest = Object.values(MODELS)
    .filter((m) => m.providerId !== "MOCK" && estimateCostForModel(m.id, params.tokenEstimate) <= budgetRemaining)
    .sort((a, b) => a.inputCostPer1k - b.inputCostPer1k)[0];

  if (cheapest) return { provider: cheapest.providerId, model: cheapest.id, reason: "cheapest_capable" };
  return { provider: "MOCK", model: "mock-model", reason: "default_provider" };
}

function estimateCostForModel(modelId: string, tokens: AITokenEstimate): number {
  const model = MODELS[modelId];
  if (!model) return 0;
  return (tokens.estimatedInputTokens / 1000) * model.inputCostPer1k
       + (tokens.estimatedOutputTokens / 1000) * model.outputCostPer1k;
}
