import type { JobStatus, JobType } from "@/types/database";

// ─── Automation (maps to automation_jobs row) ─────────────────────────────────

export type AutomationStatus = "active" | "disabled" | "draft";

export type Automation = {
  id: string;
  userId: string;
  name: string;
  description: string;
  jobType: JobType;
  status: AutomationStatus;
  scheduleHours: number;
  createdAt: string;
  updatedAt: string;
};

// ─── Execution (maps to automation_logs row) ──────────────────────────────────

export type ExecutionStatus = "success" | "failed" | "running";

export type Execution = {
  id: string;
  automationId: string;
  startedAt: string;
  completedAt: string | null;
  status: ExecutionStatus;
  result: string | null;
};

// ─── Service result ───────────────────────────────────────────────────────────

export type AutomationServiceError =
  | { code: "not_found";      message: string }
  | { code: "forbidden";      message: string }
  | { code: "network_error";  message: string }
  | { code: "unknown";        message: string };

export type AutomationResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: AutomationServiceError };
