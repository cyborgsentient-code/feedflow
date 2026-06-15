import type { ActionExecution, ExecutionResult, ExecutionServiceResult } from "../types";
import { actionExecutionSchema } from "../validators";
import { executionFingerprint } from "../utils/executionFingerprint";
import { executionReadService } from "./executionReadService";
import { executionWriteService } from "./executionWriteService";
import { mapError } from "./executionErrors";
import {
  executeSaveContent,
  executeCreateSummary,
  executeCreateDraft,
  executeNotifyUser,
} from "./executionRegistry";
import type { ExecutionPayload } from "../types";
import { classifyFailure } from "@/features/execution-reliability/services/failureClassifier";
import { getMaxRetries, backoffMs } from "@/features/execution-reliability/services/retryPolicy";
import { withTimeout, getTimeoutMs } from "@/features/execution-reliability/services/timeoutGuard";
import { executionTraceCollector } from "@/features/execution-reliability/services/executionTraceCollector";
import { executionDLQService } from "@/features/execution-reliability/services/executionDLQService";
import { executionMetrics } from "@/features/execution-reliability/utils/executionMetrics";

const REGISTRY: Record<string, (p: ExecutionPayload) => Promise<Record<string, unknown>>> = {
  save_content:   (p) => executeSaveContent(p   as Extract<ExecutionPayload, { action: "save_content" }>),
  create_summary: (p) => executeCreateSummary(p as Extract<ExecutionPayload, { action: "create_summary" }>),
  create_draft:   (p) => executeCreateDraft(p   as Extract<ExecutionPayload, { action: "create_draft" }>),
  notify_user:    (p) => executeNotifyUser(p    as Extract<ExecutionPayload, { action: "notify_user" }>),
};

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

export const actionExecutor = {
  async execute(execution: ActionExecution): Promise<ExecutionServiceResult<ExecutionResult>> {
    // 1. Validate
    const parsed = actionExecutionSchema.safeParse(execution);
    if (!parsed.success) {
      return { success: false, error: { code: "validation_failed", message: parsed.error.issues[0]?.message ?? "Invalid payload." } };
    }

    // 2. Fingerprint
    const fp = await executionFingerprint(execution.automationEventId, execution.actionType, execution.userId);

    // 3. Idempotency
    const existing = await executionReadService.getExecutionByFingerprint(fp, execution.userId);
    if (existing.success) return existing;

    // 4. Persist as processing
    const saved = await executionWriteService.saveExecutionResult({
      automationEventId: execution.automationEventId,
      userId:            execution.userId,
      actionType:        execution.actionType,
      fingerprint:       fp,
      status:            "processing",
      resultPayload:     {},
    });
    if (!saved.success) return saved;

    const traceHandle = executionTraceCollector.start(saved.data.id, fp, execution.actionType);
    const maxRetries  = getMaxRetries(execution.actionType);
    const timeoutMs   = getTimeoutMs(execution.actionType);
    const handler     = REGISTRY[execution.actionType];
    let   lastError: unknown;

    executionMetrics.recordAttempt();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        executionMetrics.recordRetry();
        await sleep(backoffMs(attempt - 1));
      }
      try {
        const resultPayload = await withTimeout(handler(execution.payload), timeoutMs);
        await executionWriteService.updateExecutionStatus(fp, execution.userId, "completed", resultPayload);
        await executionTraceCollector.finish(traceHandle);
        executionMetrics.recordSuccess();
        return executionReadService.getExecutionByFingerprint(fp, execution.userId);
      } catch (e) {
        lastError = e;
        const category = classifyFailure(e);
        if (category === "timeout_failure") executionMetrics.recordTimeout();
        // Don't retry duplicates or validation errors
        if (category === "duplicate_execution" || category === "validation_failure") break;
      }
    }

    // All attempts exhausted
    const category = classifyFailure(lastError);
    await executionWriteService.updateExecutionStatus(fp, execution.userId, "failed", { error: String(lastError) });
    await executionTraceCollector.fail(traceHandle, category);
    await executionDLQService.writeToDLQ({
      fingerprint:     fp,
      executionId:     saved.data.id,
      actionType:      execution.actionType,
      userId:          execution.userId,
      failureCategory: category,
      errorMessage:    lastError instanceof Error ? lastError.message : String(lastError),
      retryCount:      maxRetries,
    });
    executionMetrics.recordFailure();
    executionMetrics.recordDLQWrite();
    return { success: false, error: mapError(lastError) };
  },
};
