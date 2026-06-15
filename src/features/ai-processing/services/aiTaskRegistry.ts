import type { AITaskType } from "../types";

/**
 * Deterministic placeholder processors — no LLM, no fetch, no randomness.
 * Replaced by real model calls in a future module.
 */
export const aiTaskRegistry: Record<AITaskType, (text: string) => Record<string, unknown>> = {
  summary: (text) => ({
    summary: text.slice(0, 200).trimEnd() + (text.length > 200 ? "…" : ""),
  }),

  extract_keywords: (text) => ({
    keywords: text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 10),
  }),

  extract_topics: (text) => ({
    topics: ["general", text.split(" ")[0]?.toLowerCase() ?? "unknown"],
  }),

  sentiment_analysis: (text) => ({
    sentiment: text.length % 3 === 0 ? "positive" : text.length % 3 === 1 ? "neutral" : "negative",
  }),

  content_classification: (text) => ({
    classification: text.length > 500 ? "article" : "short_form",
  }),

  entity_extraction: (text) => ({
    entities: text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g)?.slice(0, 5) ?? [],
  }),

  draft_caption: (text) => ({
    caption: text.slice(0, 100).trimEnd() + "…",
  }),

  draft_post: (text) => ({
    post: text.slice(0, 240).trimEnd() + "…",
  }),
};
