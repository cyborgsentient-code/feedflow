export type InteractionType =
  | "view"
  | "click"
  | "save"
  | "summary_open"
  | "draft_open"
  | "notification_open";

export type UserInteraction = {
  id:          string;
  userId:      string;
  contentId:   string;
  sourceId:    string;
  interaction: InteractionType;
  createdAt:   string;
};

export type PreferenceProfile = {
  userId:                  string;
  sourceAffinity:          Record<string, number>;
  contentCategoryAffinity: Record<string, number>;
  interactionCount:        number;
  lastUpdated:             string;
  profileVersion:          number;
};

export type SignalComponents = {
  sourceAffinity:   number;
  engagementWeight: number;
  recencyWeight:    number;
};

export type RecommendationSignal = {
  userId:      string;
  contentId:   string;
  fingerprint: string;
  score:       number;
  components:  SignalComponents;
  createdAt:   string;
};

export type PreferenceProfileSnapshot = {
  userId:                  string;
  profileVersion:          number;
  sourceAffinity:          Record<string, number>;
  contentCategoryAffinity: Record<string, number>;
  lastComputedAt:          string;
  hash:                    string;
};

export type ProfileFailureCategory =
  | "db_failure"
  | "compute_failure"
  | "cache_failure"
  | "unknown_failure";

export type ProfileDLQEntry = {
  userId:          string;
  profileVersion:  number;
  failureCategory: ProfileFailureCategory;
  errorMessage:    string;
  retryCount:      number;
  lastAttemptAt:   string;
};

export type ProfileTrace = {
  traceId:   string;
  userId:    string;
  phase:     "start" | "finish" | "fail";
  durationMs?: number;
  error?:    string;
  timestamp: string;
};

export type IntelligenceServiceError =
  | { code: "not_found";         message: string }
  | { code: "forbidden";         message: string }
  | { code: "validation_failed"; message: string }
  | { code: "network_error";     message: string }
  | { code: "unknown";           message: string };

export type IntelligenceResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: IntelligenceServiceError };
