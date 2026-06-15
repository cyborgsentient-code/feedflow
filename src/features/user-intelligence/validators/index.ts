import { z } from "zod";

const interactionTypes = ["view", "click", "save", "summary_open", "draft_open", "notification_open"] as const;

export const userInteractionSchema = z.object({
  userId:      z.string().min(1),
  contentId:   z.string().min(1),
  sourceId:    z.string().min(1),
  interaction: z.enum(interactionTypes),
});
