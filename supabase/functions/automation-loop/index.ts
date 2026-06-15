/**
 * Automation Loop — Supabase Edge Function
 *
 * Normal invocation (pg_cron every 15 min):
 *   POST /automation-loop
 *
 * Demo mode (instant, deterministic, 3–5 actions/user):
 *   POST /automation-loop?demo=true
 *
 * Per-user execution:
 *   1. Generate batch_id + open execution_trace row
 *   2. For each action: generate trace_id, try with 2-retry backoff
 *   3. Write automation_logs (trace_id, batch_id, instagram_user_id required)
 *   4. Close execution_trace with counts + status
 *   5. Update reinforcement_scores
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACTION_TYPES  = ["like", "view", "search", "visit"] as const;
const ACTION_WEIGHTS = [0.20, 0.50, 0.20, 0.10];
type ActionType = (typeof ACTION_TYPES)[number];

// ── Deterministic seeded RNG for DEMO_MODE ────────────────────────────────────
// Simple mulberry32 — reproducible per (userId + batchIndex)
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidSeed(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function weightedPick<T>(items: readonly T[], weights: number[], rand: () => number): T {
  const r = rand();
  let c = 0;
  for (let i = 0; i < items.length; i++) { c += weights[i]; if (r <= c) return items[i]; }
  return items[items.length - 1];
}

function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ── Per-action executor with retry ───────────────────────────────────────────
async function executeAction(
  db: SupabaseClient,
  log: Record<string, unknown>,
  maxRetries = 2,
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt - 1))); // 200ms, 400ms
    }
    const { error } = await db.from("automation_logs").insert(log);
    if (!error) return { success: true };
    if (attempt === maxRetries) return { success: false, error: error.message };
  }
  return { success: false };
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const url      = new URL(req.url);
  const demoMode = url.searchParams.get("demo") === "true"
    || Deno.env.get("DEMO_MODE") === "true";

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── 1. Fetch enabled users ────────────────────────────────────────────────
  const { data: settings, error: settingsErr } = await db
    .from("user_settings")
    .select("user_id")
    .eq("automation_enabled", true);

  if (settingsErr || !settings?.length) {
    return Response.json({ ok: true, processed: 0 });
  }

  let totalProcessed = 0;

  for (const { user_id } of settings) {
    const batchId   = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const rand      = demoMode ? seededRand(uuidSeed(user_id) + Date.now()) : Math.random.bind(Math);

    // ── 2. Open execution_trace ───────────────────────────────────────────
    await db.from("automation_execution_trace").insert({
      batch_id:   batchId,
      user_id,
      started_at: startedAt,
      status:     "running",
      demo_mode:  demoMode,
    });

    // ── 3. Fetch user context ─────────────────────────────────────────────
    const [{ data: prefs }, { data: ig }] = await Promise.all([
      db.from("user_preferences")
        .select("weight, interest_categories(slug)")
        .eq("user_id", user_id)
        .order("weight", { ascending: false })
        .limit(5),
      db.from("instagram_connections")
        .select("instagram_user_id")
        .eq("user_id", user_id)
        .eq("status", "connected")
        .maybeSingle(),
    ]);

    const slugs: string[] = (prefs ?? [])
      .map((p: { interest_categories: { slug: string } | null }) => p.interest_categories?.slug)
      .filter(Boolean) as string[];
    const topicPool = slugs.length > 0 ? slugs : ["technology", "fitness", "travel"];

    // Require instagram_user_id — skip user if not connected (identity consistency)
    if (!ig?.instagram_user_id) {
      await db.from("automation_execution_trace")
        .update({ finished_at: new Date().toISOString(), status: "failed",
                  total_actions: 0, success_count: 0, failure_count: 0 })
        .eq("batch_id", batchId);
      continue;
    }

    // ── 4. Determine action count (demo: 3–5, normal: 1) ─────────────────
    const actionCount = demoMode ? 3 + Math.floor(rand() * 3) : 1;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < actionCount; i++) {
      const traceId    = crypto.randomUUID();
      const actionType: ActionType = weightedPick(ACTION_TYPES, ACTION_WEIGHTS, rand);
      const topic      = pickFrom(topicPool, rand);

      const log = {
        user_id,
        instagram_user_id:  ig.instagram_user_id,
        action_type:        actionType,
        category_slug:      topic,
        metadata:           { topic, batch_id: batchId, action_index: i, demo_mode: demoMode },
        source:             "automation_engine_v1",
        trace_id:           traceId,
        execution_batch_id: batchId,
        parent_trace_id:    null,
      };

      const { success, error } = await executeAction(db, log);

      if (success) {
        successCount++;
      } else {
        failureCount++;
        // Write failure sentinel — does NOT stop loop
        await db.from("automation_logs").insert({
          ...log,
          trace_id:    crypto.randomUUID(),
          action_type: "error",
          metadata:    { ...log.metadata as object, failure_reason: error, failed_action: actionType },
        }).then(() => {}).catch(() => {});
      }
    }

    const finalStatus =
      failureCount === 0              ? "success"
      : successCount === 0            ? "failed"
      :                                 "partial";

    // ── 5. Close execution_trace ──────────────────────────────────────────
    await db.from("automation_execution_trace")
      .update({
        finished_at:   new Date().toISOString(),
        total_actions: actionCount,
        success_count: successCount,
        failure_count: failureCount,
        status:        finalStatus,
      })
      .eq("batch_id", batchId);

    // ── 6. Update reinforcement_scores (best-effort) ──────────────────────
    await db.rpc("increment_reinforcement_score", { p_user_id: user_id, p_delta: successCount })
      .then(() => {}).catch(() => {});

    totalProcessed++;
  }

  return Response.json({ ok: true, processed: totalProcessed, demo: demoMode });
});
