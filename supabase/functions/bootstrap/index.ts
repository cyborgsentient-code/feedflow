/**
 * Bootstrap — Supabase Edge Function
 * POST /bootstrap  { user_id: string }
 *
 * Idempotent. Guarantees demo-ready state for a user:
 *   1. instagram_connections row → status = "connected"
 *   2. user_settings row → automation_enabled = true
 *   3. At least MIN_LOGS automation_logs entries
 *   4. reinforcement_scores row
 *   5. One closed automation_execution_trace
 *
 * Safe to call on every app load — skips steps already satisfied.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIN_LOGS = 6;
const ACTION_TYPES  = ["like", "view", "search", "visit", "like", "view"] as const;
const TOPIC_POOL    = ["technology", "fitness", "travel", "business", "science", "design"];

Deno.serve(async (req) => {
  const { user_id } = await req.json().catch(() => ({}));
  if (!user_id) return Response.json({ ok: false, error: "user_id required" }, { status: 400 });

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── 1. Ensure instagram_connections row is "connected" ────────────────────
  const { data: ig } = await db
    .from("instagram_connections")
    .select("status, instagram_user_id")
    .eq("user_id", user_id)
    .maybeSingle();

  const igUserId = ig?.instagram_user_id ?? `demo_user_${user_id.slice(0, 8)}`;

  if (!ig || ig.status !== "connected") {
    await db.from("instagram_connections").upsert({
      user_id,
      instagram_user_id:  igUserId,
      instagram_username: "demo_account",
      access_token:       `demo_token_${crypto.randomUUID()}`,
      status:             "connected",
      connected_at:       new Date().toISOString(),
      connection_error:   null,
      updated_at:         new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  // ── 2. Ensure user_settings exists with automation enabled ────────────────
  await db.from("user_settings").upsert(
    { user_id, automation_enabled: true, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  // ── 3. Check existing log count ───────────────────────────────────────────
  const { count: existingLogs } = await db
    .from("automation_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id);

  const needed = MIN_LOGS - (existingLogs ?? 0);

  if (needed > 0) {
    // Fetch user's actual interest slugs for realistic topics
    const { data: prefs } = await db
      .from("user_preferences")
      .select("interest_categories(slug)")
      .eq("user_id", user_id)
      .limit(5);

    const slugs: string[] = (prefs ?? [])
      .map((p: { interest_categories: { slug: string } | null }) => p.interest_categories?.slug)
      .filter(Boolean) as string[];
    const topics = slugs.length > 0 ? slugs : TOPIC_POOL;

    const batchId  = crypto.randomUUID();
    const now      = Date.now();

    // Open execution_trace
    await db.from("automation_execution_trace").insert({
      batch_id:      batchId,
      user_id,
      started_at:    new Date(now - 5000).toISOString(),
      status:        "running",
      demo_mode:     true,
    });

    // Write logs spread across last 5 minutes for natural-looking timestamps
    const logs = Array.from({ length: needed }, (_, i) => ({
      user_id,
      instagram_user_id:  igUserId,
      action_type:        ACTION_TYPES[i % ACTION_TYPES.length],
      category_slug:      topics[i % topics.length],
      metadata:           { topic: topics[i % topics.length], source: "demo_engine_v2" },
      source:             "demo_engine_v2",
      trace_id:           crypto.randomUUID(),
      execution_batch_id: batchId,
      // Spread timestamps backward: oldest first
      created_at:         new Date(now - (needed - i) * 45_000).toISOString(),
    }));

    await db.from("automation_logs").insert(logs);

    // Close execution_trace
    await db.from("automation_execution_trace")
      .update({
        finished_at:   new Date().toISOString(),
        total_actions: needed,
        success_count: needed,
        failure_count: 0,
        status:        "success",
      })
      .eq("batch_id", batchId);

    // ── 4. Upsert reinforcement_scores ─────────────────────────────────────
    await db.from("reinforcement_scores").upsert({
      user_id,
      total_score:    (existingLogs ?? 0) + needed,
      cycle_count:    1,
      actions_total:  (existingLogs ?? 0) + needed,
      last_cycle_at:  new Date().toISOString(),
      score_delta_7d: needed,
      updated_at:     new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  return Response.json({ ok: true, bootstrapped: needed > 0, logs_added: Math.max(0, needed) });
});
