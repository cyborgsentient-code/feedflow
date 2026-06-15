import { supabase } from "@/lib/supabase";
import type { ExecutionPayload } from "../types";

/** Internal action handlers — no external APIs, no AI, no OAuth. */

export async function executeSaveContent(
  payload: Extract<ExecutionPayload, { action: "save_content" }>,
): Promise<Record<string, unknown>> {
  const { error } = await supabase
    .from("saved_content")
    .upsert(
      { user_id: payload.userId, content_id: payload.contentId },
      { onConflict: "user_id,content_id" },
    );
  if (error) throw error;
  return { saved: true, contentId: payload.contentId };
}

export async function executeCreateSummary(
  payload: Extract<ExecutionPayload, { action: "create_summary" }>,
): Promise<Record<string, unknown>> {
  const { error } = await supabase
    .from("content_summaries")
    .upsert(
      { content_id: payload.contentId, summary: "Summary generation pending" },
      { onConflict: "content_id" },
    );
  if (error) throw error;
  return { contentId: payload.contentId, status: "pending" };
}

export async function executeCreateDraft(
  payload: Extract<ExecutionPayload, { action: "create_draft" }>,
): Promise<Record<string, unknown>> {
  const { error } = await supabase
    .from("draft_posts")
    .upsert(
      { content_id: payload.contentId, body: "Draft generation pending" },
      { onConflict: "content_id" },
    );
  if (error) throw error;
  return { contentId: payload.contentId, status: "pending" };
}

export async function executeNotifyUser(
  payload: Extract<ExecutionPayload, { action: "notify_user" }>,
): Promise<Record<string, unknown>> {
  const { error } = await supabase
    .from("notifications")
    .insert({ user_id: payload.userId, title: payload.title, body: payload.body });
  if (error) throw error;
  return { notified: true, userId: payload.userId };
}
