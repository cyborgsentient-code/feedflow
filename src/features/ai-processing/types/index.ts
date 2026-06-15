export type AITaskType =
  | "summary"
  | "extract_topics"
  | "extract_keywords"
  | "sentiment_analysis"
  | "content_classification"
  | "entity_extraction"
  | "draft_caption"
  | "draft_post";

export type AITaskStatus = "queued" | "processing" | "completed" | "failed";

export type AITaskPayload = {
  contentId:          string;
  contentFingerprint: string;
  contentText:        string;
  userId:             string;
};

export type AITask = {
  taskType: AITaskType;
  payload:  AITaskPayload;
};

export type AIResult = {
  taskType: AITaskType;
  output:   Record<string, unknown>;
};

export type AIJob = {
  id:          string;
  userId:      string;
  contentId:   string;
  taskType:    AITaskType;
  fingerprint: string;
  status:      AITaskStatus;
  prompt:      string;
  result:      AIResult | null;
  createdAt:   string;
  completedAt: string | null;
};

export type AIJobResult<T = AIResult> =
  | { success: true;  data: T }
  | { success: false; error: AIServiceError };

export type PromptTemplate = {
  taskType: AITaskType;
  version:  string;
  template: string;
};

export type AIServiceError =
  | { code: "invalid_task";       message: string }
  | { code: "validation_failed";  message: string }
  | { code: "duplicate_job";      message: string }
  | { code: "job_not_found";      message: string }
  | { code: "network_error";      message: string }
  | { code: "db_error";           message: string }
  | { code: "unknown";            message: string };
