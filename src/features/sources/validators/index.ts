import { z } from "zod";

export const PLATFORMS = ["instagram", "linkedin", "twitter", "rss", "website"] as const;

export const sourceCreateSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or less"),
  platform: z.enum(PLATFORMS, { required_error: "Platform is required" }),
});

export type SourceCreateValues = z.infer<typeof sourceCreateSchema>;
