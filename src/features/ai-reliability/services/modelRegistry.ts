import type { AIModel } from "../types";

export const MODELS: Record<string, AIModel> = {
  "gpt-5-mini":    { id: "gpt-5-mini",    providerId: "OPENAI",    contextWindow: 128_000, maxOutputTokens: 16_384, capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0.00015, outputCostPer1k: 0.0006  },
  "gpt-5":         { id: "gpt-5",         providerId: "OPENAI",    contextWindow: 128_000, maxOutputTokens: 16_384, capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0.005,   outputCostPer1k: 0.015   },
  "claude-sonnet": { id: "claude-sonnet", providerId: "ANTHROPIC", contextWindow: 200_000, maxOutputTokens: 8_192,  capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0.003,   outputCostPer1k: 0.015   },
  "claude-opus":   { id: "claude-opus",   providerId: "ANTHROPIC", contextWindow: 200_000, maxOutputTokens: 4_096,  capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0.015,   outputCostPer1k: 0.075   },
  "gemini-pro":    { id: "gemini-pro",    providerId: "GOOGLE",    contextWindow: 1_000_000,maxOutputTokens: 8_192, capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0.00025, outputCostPer1k: 0.00075 },
  "grok":          { id: "grok",          providerId: "XAI",       contextWindow: 131_072, maxOutputTokens: 8_192,  capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0.005,   outputCostPer1k: 0.015   },
  "mock-model":    { id: "mock-model",    providerId: "MOCK",      contextWindow: 100_000, maxOutputTokens: 4_096,  capabilities: ["summary","classification","entity_extraction","drafting","keywords","sentiment"], inputCostPer1k: 0,       outputCostPer1k: 0        },
};
