import { z } from "zod";

const aiTaskTypes = [
  "summary", "extract_topics", "extract_keywords", "sentiment_analysis",
  "content_classification", "entity_extraction", "draft_caption", "draft_post",
] as const;

export const aiTaskPayloadSchema = z.object({
  contentId:          z.string().min(1),
  contentFingerprint: z.string().min(1),
  contentText:        z.string().min(1).max(50_000),
  userId:             z.string().min(1),
});

export const aiTaskSchema = z.object({
  taskType: z.enum(aiTaskTypes),
  payload:  aiTaskPayloadSchema,
});
