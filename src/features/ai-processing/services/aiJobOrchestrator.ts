import type { AITask, AIJob, AIJobResult, AITaskType } from "../types";
import { aiPipeline } from "./aiPipeline";
import { aiReadService } from "./aiReadService";
import { aiWriteService } from "./aiWriteService";
import { mapAIError } from "./aiErrors";

export const aiJobOrchestrator = {
  /** Create and immediately run a job. Idempotent — returns existing if already done. */
  async createJob(task: AITask): Promise<AIJobResult<AIJob>> {
    return aiPipeline.runAITask(task);
  },

  /** Run a previously created but unfinished job by id. */
  async runJob(jobId: string, userId: string): Promise<AIJobResult<AIJob>> {
    const jobResult = await aiReadService.getAIJob(jobId, userId);
    if (!jobResult.success) return jobResult;
    const job = jobResult.data;
    if (job.status === "completed") return jobResult;

    const task: AITask = {
      taskType: job.taskType,
      payload:  {
        contentId:          job.contentId,
        contentFingerprint: job.fingerprint,
        contentText:        job.prompt, // prompt contains rendered content
        userId:             job.userId,
      },
    };
    return aiPipeline.runAITask(task);
  },

  async getJob(jobId: string, userId: string): Promise<AIJobResult<AIJob>> {
    return aiReadService.getAIJob(jobId, userId);
  },

  /** Retry a failed job by resetting status to queued then re-running. */
  async retryJob(jobId: string, userId: string): Promise<AIJobResult<AIJob>> {
    try {
      const jobResult = await aiReadService.getAIJob(jobId, userId);
      if (!jobResult.success) return jobResult;
      if (jobResult.data.status !== "failed") return jobResult;

      await aiWriteService.updateJobStatus(jobResult.data.fingerprint, userId, "queued");
      return this.runJob(jobId, userId);
    } catch (e) {
      return { success: false, error: mapAIError(e) };
    }
  },
};
