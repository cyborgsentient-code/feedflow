import type { AIProvider, AIModel, AIModelCapability } from "../types";

export const PROVIDERS: Record<string, AIProvider> = {
  OPENAI:    { id: "OPENAI",    name: "OpenAI",              supportedModels: ["gpt-5-mini", "gpt-5"] },
  ANTHROPIC: { id: "ANTHROPIC", name: "Anthropic",           supportedModels: ["claude-sonnet", "claude-opus"] },
  GOOGLE:    { id: "GOOGLE",    name: "Google DeepMind",     supportedModels: ["gemini-pro"] },
  XAI:       { id: "XAI",       name: "xAI",                 supportedModels: ["grok"] },
  MOCK:      { id: "MOCK",      name: "Mock (placeholder)",  supportedModels: ["mock-model"] },
};
