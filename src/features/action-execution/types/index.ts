export type ActionType =
  | "save_content"
  | "create_summary"
  | "create_draft"
  | "notify_user";

export type ExecutionStatus = "queued" | "processing" | "completed" | "failed";

export type ExecutionPayload =
  | { action: "save_content";   contentId: string; userId: string }
  | { action: "create_summary"; contentId: string }
  | { action: "create_draft";   contentId: string }
  | { action: "notify_user";    userId: string; title: string; body: string };

export type ExecutionResult = {
  id:                 string;
  automationEventId:  string;
  userId:             string;
  actionType:         ActionType;
  fingerprint:        string;
  status:             ExecutionStatus;
  resultPayload:      Record<string, unknown>;
  createdAt:          string;
  completedAt:        string | null;
};

export type ActionExecution = {
  automationEventId: string;
  userId:            string;
  actionType:        ActionType;
  payload:           ExecutionPayload;
};

export type ExecutionServiceError =
  | { code: "not_found";         message: string }
  | { code: "validation_failed"; message: string }
  | { code: "forbidden";         message: string }
  | { code: "duplicate";         message: string }
  | { code: "network_error";     message: string }
  | { code: "unknown";           message: string };

export type ExecutionServiceResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: ExecutionServiceError };
