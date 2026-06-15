import { z } from "zod";

export const rawContentSchema = z.object({
  id:           z.string().min(1),
  source_id:    z.string().min(1),
  external_id:  z.string().optional(),
  title:        z.string().min(1).max(500),
  body:         z.string().max(50_000),
  media_urls:   z.array(z.string().url()).max(20),
  author:       z.string().max(200).optional(),
  published_at: z.string().datetime({ offset: true }),
  raw_payload:  z.unknown(),
});

export type ValidatedRawContent = z.infer<typeof rawContentSchema>;
