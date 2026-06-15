import { useState, useCallback, useRef } from "react";
import { runIngestionPipeline } from "../services/ingestionPipeline";
import type { RawContent, IngestionStatus, IngestionError } from "../types";

export function useIngestion() {
  const [status, setStatus]               = useState<IngestionStatus>("idle");
  const [error, setError]                 = useState<IngestionError | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  // seenFingerprints persists across calls within the same hook instance
  const seenFingerprints = useRef(new Set<string>());

  const ingestContent = useCallback(async (sourceId: string, rawItems: RawContent[]) => {
    setStatus("processing");
    setError(null);

    // Tag all items with the provided sourceId (adapter responsibility is upstream)
    const tagged = rawItems.map((r) => ({ ...r, source_id: sourceId }));
    const result = await runIngestionPipeline(tagged, seenFingerprints.current);

    if (!result.success) {
      setError(result.error);
      setStatus("error");
      return result;
    }

    setProcessedCount((prev) => prev + result.processedCount);
    setStatus("done");
    return result;
  }, []);

  return { ingestContent, status, error, processedCount };
}
