import { z } from "zod";

const actionTypes = ["save_content", "create_summary", "create_draft", "notify_user"] as const;

export const executionPayloadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save_content"),   contentId: z.string().min(1), userId: z.string().min(1) }),
  z.object({ action: z.literal("create_summary"), contentId: z.string().min(1) }),
  z.object({ action: z.literal("create_draft"),   contentId: z.string().min(1) }),
  z.object({ action: z.literal("notify_user"),    userId: z.string().min(1), title: z.string().min(1).max(200), body: z.string().min(1).max(1000) }),
]);

export const actionExecutionSchema = z.object({
  automationEventId: z.string().min(1),
  userId:            z.string().min(1),
  actionType:        z.enum(actionTypes),
  payload:           executionPayloadSchema,
});
