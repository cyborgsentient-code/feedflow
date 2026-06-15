/**
 * System Health Snapshot — Supabase Edge Function
 * GET /system-health
 * Returns health metrics for admin/debug view. Service-role only.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Require service role or internal call
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "NONE")) {
    return new Response("Forbidden", { status: 403 });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const tenMinAgo = new Date(now.getTime() - 10 * 60_000).toISOString();

  const [
    { count: activeUsers },
    { data: recentLogs },
    { data: recentFailures },
    { data: recentTraces },
    { data: lastExecPerUser },
  ] = await Promise.all([
    // active_users_automation_enabled
    db.from("user_settings").select("*", { count: "exact", head: true }).eq("automation_enabled", true),
    // logs_per_minute (last 10 min)
    db.from("automation_logs").select("created_at").gte("created_at", tenMinAgo),
    // failure_rate
    db.from("automation_logs").select("action_type").eq("action_type", "error").gte("created_at", tenMinAgo),
    // avg_batch_size from execution traces
    db.from("automation_execution_trace").select("total_actions").gte("started_at", tenMinAgo),
    // last_execution_time per user
    db.from("automation_execution_trace")
      .select("user_id, finished_at")
      .order("finished_at", { ascending: false })
      .limit(50),
  ]);

  const totalLogs    = recentLogs?.length ?? 0;
  const totalFails   = recentFailures?.length ?? 0;
  const logsPerMin   = totalLogs / 10;
  const failureRate  = totalLogs > 0 ? totalFails / totalLogs : 0;

  const batchSizes   = recentTraces?.map((t) => t.total_actions ?? 0) ?? [];
  const avgBatchSize = batchSizes.length > 0
    ? batchSizes.reduce((a, b) => a + b, 0) / batchSizes.length
    : 0;

  // Deduplicate last_execution_time per user
  const lastExec: Record<string, string> = {};
  for (const row of lastExecPerUser ?? []) {
    if (!lastExec[row.user_id] && row.finished_at) lastExec[row.user_id] = row.finished_at;
  }

  return Response.json({
    computed_at:                now.toISOString(),
    active_users_automation_enabled: activeUsers ?? 0,
    logs_per_minute:            Math.round(logsPerMin * 100) / 100,
    failure_rate:               Math.round(failureRate * 1000) / 1000,
    avg_batch_size:             Math.round(avgBatchSize * 100) / 100,
    last_execution_per_user:    lastExec,
  });
});
