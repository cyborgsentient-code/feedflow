import type { RawContent, NormalizedContent, IngestionResult } from "../types";
import { rawContentSchema } from "../validators";
import { normalizeContent } from "./ingestionNormalizer";
import { mapIngestionError } from "./ingestionErrors";

export type PipelineOutput = {
  normalized: NormalizedContent[];
  duplicateCount: number;
};

/**
 * raw → validate → normalize → dedupe → emit
 *
 * seenFingerprints: caller-supplied set enables cross-batch deduplication.
 */
export async function runIngestionPipeline(
  items: RawContent[],
  seenFingerprints: Set<string> = new Set(),
): Promise<IngestionResult & { output?: PipelineOutput }> {
  const normalized: NormalizedContent[] = [];
  let duplicateCount = 0;

  for (const item of items) {
    // 1. Validate
    const parsed = rawContentSchema.safeParse(item);
    if (!parsed.success) {
      return {
        success: false,
        error: { code: "invalid_payload", message: parsed.error.issues[0]?.message ?? "Invalid payload." },
      };
    }

    // 2. Normalize
    let norm: NormalizedContent;
    try {
      norm = await normalizeContent(parsed.data as RawContent);
    } catch (e) {
      return { success: false, error: mapIngestionError(e) };
    }

    // 3. Dedupe
    if (seenFingerprints.has(norm.fingerprint)) {
      duplicateCount++;
      continue;
    }
    seenFingerprints.add(norm.fingerprint);

    // 4. Emit
    normalized.push(norm);
  }

  return {
    success: true,
    processedCount: normalized.length,
    output: { normalized, duplicateCount },
  };
}
