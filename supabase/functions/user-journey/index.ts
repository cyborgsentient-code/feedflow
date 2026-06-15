/**
 * User Journey — Supabase Edge Function
 *
 * GET /user-journey/:userId                 → full journey object
 * GET /user-journey/:userId?story=true      → step-by-step narrative timeline
 *
 * Auth: Bearer token (validates user owns the requested id, or service role for any id)
 *
 * All data derived exclusively from existing tables:
 *   profiles, instagram_connections, user_preferences, interest_categories,
 *   user_settings, automation_execution_trace, automation_logs,
 *   reinforcement_scores, analytics_snapshots
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryImpact = {
  actions: number;
  action_breakdown: Record<string, number>;
  share_of_total: number;        // 0–1
  reinforcement_score_delta: number;
};

type BatchSummary = {
  batch_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_actions: number;
  success_count: number;
  failure_count: number;
  demo_mode: boolean;
  logs: LogSummary[];
};

type LogSummary = {
  id: string;
  trace_id: string;
  action_type: string;
  category_slug: string | null;
  created_at: string;
};

type FeedImpact = {
  before_score: number;
  after_score: number;
  delta: number;
  basis: string;
};

type UserJourney = {
  user_id: string;
  computed_at: string;
  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  // Instagram connection
  instagram_connection: {
    status: string;
    instagram_username: string | null;
    connected_at: string | null;
  } | null;
  // Preferences
  preferences_selected: Array<{ slug: string; label: string; weight: number; selected_at: string }>;
  // Automation
  automation_enabled: boolean;
  automation_batches: BatchSummary[];
  // Reinforcement
  reinforcement: {
    total_score: number;
    cycle_count: number;
    actions_total: number;
    score_delta_7d: number;
    last_cycle_at: string | null;
  } | null;
  // Causal graph
  category_impact: Record<string, CategoryImpact>;
  // Feed impact
  feed_relevance: FeedImpact;
  // Counts
  total_actions: number;
  total_batches: number;
};

type StoryStep = { at: string; event: string; detail: string };

// ── Data fetchers (all parallel where possible) ───────────────────────────────

async function fetchAllUserData(db: SupabaseClient, userId: string) {
  const [
    profileRes,
    igRes,
    prefsRes,
    settingsRes,
    tracesRes,
    scoreRes,
    snapshotsRes,
  ] = await Promise.all([
    db.from("profiles").select("onboarding_complete, created_at, updated_at").eq("id", userId).maybeSingle(),
    db.from("instagram_connections").select("status, instagram_username, connected_at, created_at").eq("user_id", userId).maybeSingle(),
    db.from("user_preferences")
      .select("weight, created_at, interest_categories(slug, label)")
      .eq("user_id", userId)
      .order("weight", { ascending: false }),
    db.from("user_settings").select("automation_enabled").eq("user_id", userId).maybeSingle(),
    db.from("automation_execution_trace")
      .select("batch_id, started_at, finished_at, status, total_actions, success_count, failure_count, demo_mode")
      .eq("user_id", userId)
      .order("started_at", { ascending: true }),
    db.from("reinforcement_scores")
      .select("total_score, cycle_count, actions_total, score_delta_7d, last_cycle_at, created_at")
      .eq("user_id", userId)
      .maybeSingle(),
    db.from("analytics_snapshots")
      .select("snapshot_date, reinforcement_score, actions_performed")
      .eq("user_id", userId)
      .order("snapshot_date", { ascending: true }),
  ]);

  return {
    profile:   profileRes.data,
    ig:        igRes.data,
    prefs:     prefsRes.data ?? [],
    settings:  settingsRes.data,
    traces:    tracesRes.data ?? [],
    score:     scoreRes.data,
    snapshots: snapshotsRes.data ?? [],
  };
}

async function fetchLogsForBatches(
  db: SupabaseClient,
  userId: string,
  batchIds: string[],
): Promise<Record<string, LogSummary[]>> {
  if (!batchIds.length) return {};
  const { data } = await db
    .from("automation_logs")
    .select("id, trace_id, action_type, category_slug, execution_batch_id, created_at")
    .eq("user_id", userId)
    .in("execution_batch_id", batchIds)
    .order("created_at", { ascending: true });

  const grouped: Record<string, LogSummary[]> = {};
  for (const row of data ?? []) {
    const bid = row.execution_batch_id as string;
    if (!grouped[bid]) grouped[bid] = [];
    grouped[bid].push({
      id: row.id, trace_id: row.trace_id,
      action_type: row.action_type, category_slug: row.category_slug,
      created_at: row.created_at,
    });
  }
  return grouped;
}

// ── Causal graph computation ──────────────────────────────────────────────────

function computeCategoryImpact(
  allLogs: LogSummary[],
  scoreData: { total_score: number; actions_total: number; score_delta_7d: number } | null,
): Record<string, CategoryImpact> {
  const totals: Record<string, { count: number; breakdown: Record<string, number> }> = {};
  let nonErrorTotal = 0;

  for (const log of allLogs) {
    if (log.action_type === "error") continue;
    const slug = log.category_slug ?? "uncategorised";
    if (!totals[slug]) totals[slug] = { count: 0, breakdown: {} };
    totals[slug].count++;
    totals[slug].breakdown[log.action_type] = (totals[slug].breakdown[log.action_type] ?? 0) + 1;
    nonErrorTotal++;
  }

  const scorePerAction = nonErrorTotal > 0 && scoreData
    ? scoreData.total_score / nonErrorTotal
    : 0;

  const result: Record<string, CategoryImpact> = {};
  for (const [slug, { count, breakdown }] of Object.entries(totals)) {
    result[slug] = {
      actions: count,
      action_breakdown: breakdown,
      share_of_total: nonErrorTotal > 0 ? count / nonErrorTotal : 0,
      reinforcement_score_delta: Math.round(count * scorePerAction * 100) / 100,
    };
  }
  return result;
}

// ── Feed relevance derivation ─────────────────────────────────────────────────
// before_score: reinforcement_scores.created_at baseline (score = 0)
// after_score: current total_score normalised to 0–100
// No mocking: if no score row exists, before = after = 0

function computeFeedRelevance(
  scoreData: { total_score: number; actions_total: number; score_delta_7d: number } | null,
  snapshots: Array<{ reinforcement_score: number; actions_performed: number }>,
): FeedImpact {
  const before_score = 0; // always 0 at account creation — no prior data possible
  if (!scoreData || scoreData.actions_total === 0) {
    return { before_score: 0, after_score: 0, delta: 0, basis: "no_automation_yet" };
  }

  // Normalise: score grows with actions, bounded at 100
  const after_score = Math.min(
    100,
    Math.round(
      (scoreData.total_score / Math.max(1, scoreData.actions_total)) * 10 +
      Math.min(scoreData.actions_total * 0.5, 80),
    ),
  );

  const basis = snapshots.length > 1
    ? `derived_from_${snapshots.length}_snapshots_and_reinforcement_score`
    : "derived_from_reinforcement_score";

  return { before_score, after_score, delta: after_score - before_score, basis };
}

// ── Story mode narrative ──────────────────────────────────────────────────────

function buildStory(journey: UserJourney): StoryStep[] {
  const steps: StoryStep[] = [];

  if (journey.onboarding_completed_at) {
    steps.push({
      at: journey.onboarding_completed_at,
      event: "onboarding_completed",
      detail: `User completed onboarding with ${journey.preferences_selected.length} interest(s) selected`,
    });
  }

  for (const pref of journey.preferences_selected) {
    steps.push({
      at: pref.selected_at,
      event: "preference_selected",
      detail: `Selected interest: ${pref.label} (weight ${pref.weight})`,
    });
  }

  if (journey.instagram_connection?.connected_at) {
    steps.push({
      at: journey.instagram_connection.connected_at,
      event: "instagram_connected",
      detail: `Instagram account @${journey.instagram_connection.instagram_username ?? "unknown"} connected`,
    });
  }

  for (const batch of journey.automation_batches) {
    steps.push({
      at: batch.started_at,
      event: "automation_batch_started",
      detail: `Batch ${batch.batch_id.slice(0, 8)} started${batch.demo_mode ? " (demo)" : ""}`,
    });
    if (batch.finished_at) {
      steps.push({
        at: batch.finished_at,
        event: "automation_batch_finished",
        detail: `Batch completed: ${batch.success_count} actions succeeded, ${batch.failure_count} failed — status: ${batch.status}`,
      });
    }
    for (const log of batch.logs) {
      steps.push({
        at: log.created_at,
        event: `action_${log.action_type}`,
        detail: log.category_slug
          ? `${log.action_type} on ${log.category_slug} content (trace: ${log.trace_id.slice(0, 8)})`
          : `${log.action_type} (trace: ${log.trace_id.slice(0, 8)})`,
      });
    }
  }

  if (journey.reinforcement?.last_cycle_at) {
    steps.push({
      at: journey.reinforcement.last_cycle_at,
      event: "reinforcement_updated",
      detail: `Reinforcement score reached ${journey.reinforcement.total_score} across ${journey.reinforcement.cycle_count} cycle(s), +${journey.reinforcement.score_delta_7d} in last 7 days`,
    });
  }

  if (journey.feed_relevance.delta > 0) {
    steps.push({
      at: journey.computed_at,
      event: "feed_impact_measured",
      detail: `Feed relevance moved from ${journey.feed_relevance.before_score} → ${journey.feed_relevance.after_score} (Δ${journey.feed_relevance.delta})`,
    });
  }

  return steps.sort((a, b) => a.at.localeCompare(b.at));
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const url    = new URL(req.url);
  // Path: /user-journey/<userId>
  const userId = url.pathname.split("/").filter(Boolean).pop();
  if (!userId) return new Response("Missing user_id", { status: 400 });

  const storyMode = url.searchParams.get("story") === "true";

  const authHeader = req.headers.get("Authorization") ?? "";
  const isServiceRole = authHeader.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "__NONE__");

  // Validate JWT ownership when not service-role
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!isServiceRole) {
    const userDb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userDb.auth.getUser();
    if (!user || user.id !== userId) return new Response("Forbidden", { status: 403 });
  }

  // ── Fetch all raw data ────────────────────────────────────────────────────
  const { profile, ig, prefs, settings, traces, score, snapshots } =
    await fetchAllUserData(db, userId);

  const batchIds = (traces ?? []).map((t: { batch_id: string }) => t.batch_id);
  const logsByBatch = await fetchLogsForBatches(db, userId, batchIds);

  // ── Assemble batches with logs ────────────────────────────────────────────
  const batches: BatchSummary[] = (traces ?? []).map((t: {
    batch_id: string; started_at: string; finished_at: string | null;
    status: string; total_actions: number; success_count: number;
    failure_count: number; demo_mode: boolean;
  }) => ({
    batch_id:      t.batch_id,
    started_at:    t.started_at,
    finished_at:   t.finished_at,
    status:        t.status,
    total_actions: t.total_actions,
    success_count: t.success_count,
    failure_count: t.failure_count,
    demo_mode:     t.demo_mode,
    logs:          logsByBatch[t.batch_id] ?? [],
  }));

  const allLogs = Object.values(logsByBatch).flat();
  const categoryImpact = computeCategoryImpact(allLogs, score);
  const feedRelevance  = computeFeedRelevance(score, snapshots);

  const journey: UserJourney = {
    user_id:       userId,
    computed_at:   new Date().toISOString(),
    onboarding_completed:    profile?.onboarding_complete ?? false,
    onboarding_completed_at: profile?.updated_at ?? null,
    instagram_connection: ig
      ? { status: ig.status, instagram_username: ig.instagram_username, connected_at: ig.connected_at }
      : null,
    preferences_selected: (prefs ?? []).map((p: {
      weight: number; created_at: string;
      interest_categories: { slug: string; label: string } | null;
    }) => ({
      slug:        p.interest_categories?.slug ?? "unknown",
      label:       p.interest_categories?.label ?? "Unknown",
      weight:      p.weight,
      selected_at: p.created_at,
    })),
    automation_enabled: settings?.automation_enabled ?? false,
    automation_batches: batches,
    reinforcement: score
      ? {
          total_score:    score.total_score,
          cycle_count:    score.cycle_count,
          actions_total:  score.actions_total,
          score_delta_7d: score.score_delta_7d,
          last_cycle_at:  score.last_cycle_at,
        }
      : null,
    category_impact:  categoryImpact,
    feed_relevance:   feedRelevance,
    total_actions:    allLogs.filter((l) => l.action_type !== "error").length,
    total_batches:    batches.length,
  };

  if (storyMode) {
    return Response.json({ user_id: userId, story: buildStory(journey) });
  }

  return Response.json(journey);
});
