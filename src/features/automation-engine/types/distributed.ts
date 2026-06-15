export type QueueJobStatus = "pending" | "processing" | "done" | "failed" | "dead";

export type QueueJob = {
  id:           string;
  userId:       string;
  contentId:    string;
  ruleId:       string;
  fingerprint:  string;
  status:       QueueJobStatus;
  attempts:     number;
  nextRetryAt:  string | null;
  lockedBy:     string | null;
  lockedAt:     string | null;
  payload:      Record<string, unknown>;
  createdAt:    string;
};

export type EnqueuePayload = {
  userId:          string;
  contentId:       string;
  ruleId:          string;
  fingerprint:     string;
  rankScore:       number;
  matchedKeywords: string[];
  sourceId:        string;
  sequenceNumber:  number;
  createdAt:       string;
};
