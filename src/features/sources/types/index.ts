export type Platform = "instagram" | "linkedin" | "twitter" | "rss" | "website";
export type SourceStatus = "active" | "paused" | "error";

export type Source = {
  id:         string;
  userId:     string;
  name:       string;
  platform:   Platform;
  status:     SourceStatus;
  createdAt:  string;
  updatedAt:  string;
};

export type SourceServiceError =
  | { code: "not_found";        message: string }
  | { code: "forbidden";        message: string }
  | { code: "network_error";    message: string }
  | { code: "validation_error"; message: string }
  | { code: "unknown";          message: string };

export type SourceResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: SourceServiceError };
