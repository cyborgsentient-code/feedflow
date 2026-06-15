import type { AITask, AIJob, AIJobResult } from "../types";
import { aiTaskSchema } from "../validators";
import { promptFingerprint } from "../utils/promptFingerprint";
import { renderPrompt, TEMPLATE_VERSION } from "./promptTemplates";
import { aiTaskRegistry } from "./aiTaskRegistry";
import { aiReadService } from "./aiReadService";
import { aiWriteService } from "./aiWriteService";
import { mapAIError } from "./aiErrors";
// Reliability layer
import { classifyAIFailure } from "@/features/ai-reliability/services/aiFailureClassifier";
import { getMaxRetries, getRetryDelay } from "@/features/ai-reliability/services/aiRetryPolicy";
import { withAITimeout } from "@/features/ai-reliability/services/aiTimeoutGuard";
import { startTrace, completeTrace, failTrace, flushTraces } from "@/features/ai-reliability/services/aiTraceCollector";
import { aiDLQService } from "@/features/ai-reliability/services/aiDLQService";
import { aiMetricsCollector } from "@/features/ai-reliability/services/aiMetricsCollector";
import { aiBudgetService } from "@/features/ai-reliability/services/aiBudgetService";
import { estimateTokens } from "@/features/ai-reliability/utils/tokenEstimator";
import { estimateCost } from "@/features/ai-reliability/services/aiCostEstimator";

const DEFAULT_MODEL = "mock-model";

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

export const aiPipeline = {
  async runAITask(task: AITask): Promise<AIJobResult<AIJob>> {
    // 1. Validate
    const parsed = aiTaskSchema.safeParse(task);
    if (!parsed.success) {
      return { success: false, error: { code: "validation_failed", message: parsed.error.issues[0]?.message ?? "Invalid task." } };
    }

    // 2. Budget check
    const tokenEst = estimateTokens(task.payload.contentText);
    const costEst  = estimateCost(DEFAULT_MODEL, tokenEst);
    const budget   = await aiBudgetService.getUserBudget(task.payload.userId);
    const check    = aiBudgetService.checkBudget(budget, costEst.estimatedCostUsd, tokenEst.estimatedTotalTokens);
    if (check !== "ok") {
      return { success: false, error: { code: "invalid_task", message: `Budget limit: ${check}` } };
    }

    // 3. Prompt + fingerprint
    const prompt = renderPrompt(task.taskType, task.payload.contentText);
    const fp     = await promptFingerprint(task.taskType, TEMPLATE_VERSION, task.payload.contentFingerprint);

    // 4. Idempotency
    const existing = await aiReadService.getAIResultByFingerprint(fp, task.payload.userId);
    if (existing.success && existing.data.status === "completed") return existing;

    // 5. Persist as processing
    const created = await aiWriteService.createAIJob({
      userId:      task.payload.userId,
      contentId:   task.payload.contentId,
      taskType:    task.taskType,
      fingerprint: fp,
      status:      "processing",
      prompt,
    });
    if (!created.success) return created;

    const trace       = startTrace(created.data.id, fp, task.taskType);
    const maxRetries  = getMaxRetries(task.taskType);
    let   lastError: unknown;

    // 6. Execute with retry + timeout
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) await sleep(getRetryDelay(attempt - 1));
      try {
        const output = await withAITimeout(
          Promise.resolve(aiTaskRegistry[task.taskType](task.payload.contentText)),
          task.taskType,
        );
        await aiWriteService.saveAIResult(fp, task.payload.userId, { taskType: task.taskType, output });
        await aiBudgetService.recordUsage(task.payload.userId, costEst.estimatedCostUsd, tokenEst.estimatedTotalTokens);
        const finished = completeTrace(trace, tokenEst.estimatedTotalTokens, costEst.estimatedCostUsd);
        void flushTraces([finished]);
        aiMetricsCollector.recordCompleted(finished.durationMs ?? 0, tokenEst.estimatedTotalTokens, costEst.estimatedCostUsd);
        return aiReadService.getAIResultByFingerprint(fp, task.payload.userId);
      } catch (e) {
        lastError = e;
        const cat = classifyAIFailure(e);
        if (cat === "duplicate_job" || cat === "validation_failure") break;
      }
    }

    // 7. All attempts failed
    const failCategory = classifyAIFailure(lastError);
    await aiWriteService.updateJobStatus(fp, task.payload.userId, "failed");
    const failed = failTrace(trace, failCategory);
    void flushTraces([failed]);
    await aiDLQService.writeDLQEntry({
      jobId:           created.data.id,
      fingerprint:     fp,
      userId:          task.payload.userId,
      taskType:        task.taskType,
      failureCategory: failCategory,
      errorMessage:    lastError instanceof Error ? lastError.message : String(lastError),
      retryCount:      maxRetries,
    });
    aiMetricsCollector.recordFailed();
    aiMetricsCollector.recordDLQ();
    return { success: false, error: mapAIError(lastError) };
  },
};
