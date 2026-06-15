import { z } from "zod";

export const automationCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or less"),
  description: z
    .string()
    .max(300, "Description must be 300 characters or less")
    .default(""),
  scheduleHours: z
    .number({ invalid_type_error: "Schedule must be a number" })
    .int()
    .min(1, "Minimum 1 hour")
    .max(168, "Maximum 168 hours (1 week)"),
});

export const automationUpdateSchema = automationCreateSchema.partial().extend({
  status: z.enum(["active", "disabled", "draft"]).optional(),
});

export type AutomationCreateValues = z.infer<typeof automationCreateSchema>;
export type AutomationUpdateValues = z.infer<typeof automationUpdateSchema>;
