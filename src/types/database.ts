// This file will be replaced by Supabase generated types.
// Run: npx supabase gen types typescript --project-id <id> > src/types/database.ts
//
// The Tables<T> helper below ensures consumers don't change
// when you swap manual types for generated ones.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type JobStatus   = "pending" | "running" | "completed" | "failed" | "cancelled" | "scheduled";
export type JobType     = "hashtag_discovery" | "account_recommendation" | "content_scoring" | "reinforcement_cycle" | "analytics_snapshot" | "preference_sync";
export type ActionType  = "hashtag_explored" | "account_discovered" | "post_liked" | "reel_watched" | "profile_visited" | "keyword_searched" | "reinforcement_calculated" | "snapshot_created";
export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "failed" | "expired";

// Row types — named to match Supabase codegen output convention
export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type InstagramConnection = {
  id: string;
  user_id: string;
  instagram_username: string | null;
  instagram_name: string | null;
  profile_picture_url: string | null;
  status: ConnectionStatus;
  last_sync_at: string | null;
  connection_error: string | null;
  created_at: string;
  updated_at: string;
};

export type InterestCategory = {
  id: number;
  slug: string;
  label: string;
  icon: string | null;
  hashtags: string[];
  description: string | null;
  sort_order: number;
};

export type UserPreference = {
  id: string;
  user_id: string;
  category_id: number;
  weight: number;
  created_at: string;
};

export type NegativePreference = {
  id: string;
  user_id: string;
  category_id: number;
  created_at: string;
};

export type AutomationJob = {
  id: string;
  user_id: string;
  job_type: JobType;
  status: JobStatus;
  priority: number;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  next_run_at: string | null;
  payload: Json;
  result: Json;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
};

export type AutomationLog = {
  id: string;
  user_id: string;
  job_id: string | null;
  action_type: ActionType;
  category_slug: string | null;
  metadata: Json;
  created_at: string;
};

export type ReinforcementScore = {
  id: string;
  user_id: string;
  total_score: number;
  cycle_count: number;
  actions_total: number;
  last_cycle_at: string | null;
  score_delta_7d: number;
  created_at: string;
  updated_at: string;
};

export type AnalyticsSnapshot = {
  id: string;
  user_id: string;
  snapshot_date: string;
  jobs_completed: number;
  actions_performed: number;
  accounts_discovered: number;
  hashtags_explored: number;
  reinforcement_score: number;
  top_categories: string[];
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  automation_enabled: boolean;
  automation_frequency_hours: number;
  notifications_enabled: boolean;
  notify_on_cycle_complete: boolean;
  created_at: string;
  updated_at: string;
};

// Convenience helper — matches Supabase codegen Tables<T> pattern.
// When you replace this file with generated types, this helper remains compatible.
export type TableRow<T extends keyof TableMap> = TableMap[T];

type TableMap = {
  profiles: Profile;
  instagram_connections: InstagramConnection;
  interest_categories: InterestCategory;
  user_preferences: UserPreference;
  negative_preferences: NegativePreference;
  automation_jobs: AutomationJob;
  automation_logs: AutomationLog;
  reinforcement_scores: ReinforcementScore;
  analytics_snapshots: AnalyticsSnapshot;
  user_settings: UserSettings;
};
