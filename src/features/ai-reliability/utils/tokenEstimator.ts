import type { AITokenEstimate } from "../types";

/** tokens ≈ ceil(characters / 4) — no tokenizer dependency. */
export function estimateTokens(content: string, outputMultiplier = 0.5): AITokenEstimate {
  const estimatedInputTokens  = Math.ceil(content.length / 4);
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * outputMultiplier);
  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedTotalTokens: estimatedInputTokens + estimatedOutputTokens,
  };
}
