import type { PromptTemplate, AITaskType } from "../types";

export const TEMPLATE_VERSION = "1.0";

const TEMPLATES: Record<AITaskType, string> = {
  summary:
    "Summarize the following content in 2-3 sentences. Focus on the key points.\n\nContent:\n{{content}}",
  extract_topics:
    "Identify the main topics discussed in the following content. Return as a list.\n\nContent:\n{{content}}",
  extract_keywords:
    "Extract the most important keywords from the following content.\n\nContent:\n{{content}}",
  sentiment_analysis:
    "Analyze the sentiment of the following content. Return: positive, negative, or neutral.\n\nContent:\n{{content}}",
  content_classification:
    "Classify the following content into one of these categories: news, opinion, tutorial, product, entertainment, other.\n\nContent:\n{{content}}",
  entity_extraction:
    "Extract all named entities (people, organizations, locations, products) from the following content.\n\nContent:\n{{content}}",
  draft_caption:
    "Write a short social media caption (under 150 characters) for the following content.\n\nContent:\n{{content}}",
  draft_post:
    "Write a social media post (under 280 characters) based on the following content.\n\nContent:\n{{content}}",
};

export function getPromptTemplate(taskType: AITaskType): PromptTemplate {
  return { taskType, version: TEMPLATE_VERSION, template: TEMPLATES[taskType] };
}

export function renderPrompt(taskType: AITaskType, contentText: string): string {
  return TEMPLATES[taskType].replace("{{content}}", contentText.slice(0, 2000));
}
