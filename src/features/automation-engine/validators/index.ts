import { z } from "zod";

const feedBuckets = ["latest", "source", "recommended"] as const;

export const automationRuleSchema = z.object({
  id:      z.string().min(1),
  user_id: z.string().min(1),
  name:    z.string().min(1).max(100),
  enabled: z.boolean(),
  conditions: z.object({
    keywords:     z.array(z.string().max(100)).max(20).optional(),
    sourceIds:    z.array(z.string()).max(50).optional(),
    minRankScore: z.number().min(0).max(1).optional(),
    feedBucket:   z.enum(feedBuckets).optional(),
    maxAgeHours:  z.number().int().min(1).max(720).optional(),
  }),
});

export const triggerEventSchema = z.object({
  userId:    z.string().min(1),
  contentId: z.string().min(1),
  ruleId:    z.string().min(1),
  timestamp: z.number().int().positive(),
});
