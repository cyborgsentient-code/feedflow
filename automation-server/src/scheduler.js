const { supabase } = require("./supabase");
const { runSession } = require("./automation");

const runningSessions = new Set();

async function logAction(userId, actionType, payload) {
  const { error } = await supabase.from("automation_logs").insert({
    user_id: userId,
    action_type: actionType,
    metadata: payload,
    source: "railway-automation-server",
  });
  if (error) console.error("logAction:", error.message);
}

async function updateConnectionStatus(userId, status) {
  const { error } = await supabase
    .from("instagram_connections")
    .upsert({ user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) console.error("updateConnectionStatus:", error.message);
}

async function getUserData(userId) {
  const { data: conn } = await supabase
    .from("instagram_connections")
    .select("instagram_username, access_token, status")
    .eq("user_id", userId)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("interests")
    .eq("id", userId)
    .single();

  let interests = profile?.interests ?? [];

  if (!interests.length) {
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("interest_categories(slug)")
      .eq("user_id", userId);
    interests = (prefs ?? []).map((p) => p.interest_categories?.slug).filter(Boolean);
  }

  return { conn, interests };
}

async function runAutomationForUser(userId) {
  if (runningSessions.has(userId)) {
    console.log(`[${userId}] Session already running, skipping`);
    return;
  }

  runningSessions.add(userId);
  console.log(`[${userId}] Starting automation session`);

  try {
    const { conn, interests } = await getUserData(userId);

    if (!conn?.instagram_username || !conn?.access_token) {
      console.log(`[${userId}] No Instagram credentials found`);
      return;
    }

    if (!interests.length) {
      console.log(`[${userId}] No interests set`);
      return;
    }

    console.log(`[${userId}] Interests: ${interests.join(", ")}`);
    await updateConnectionStatus(userId, "connecting");
    await logAction(userId, "snapshot_created", { message: "Automation session started" });

    const result = await runSession(userId, conn.instagram_username, conn.access_token, interests);

    for (const action of result.actions) {
      await logAction(userId, action.type, action.payload);
    }

    await updateConnectionStatus(userId, result.success ? "connected" : "failed");
    await logAction(userId, "reinforcement_calculated", {
      actions_count: result.actions.length,
      success: result.success,
      error: result.error ?? null,
    });

    console.log(`[${userId}] Session complete — ${result.actions.length} actions`);

  } catch (err) {
    console.error(`[${userId}] Session error:`, err.message);
    await logAction(userId, "error", { error: err.message });
    await updateConnectionStatus(userId, "failed");
  } finally {
    runningSessions.delete(userId);
  }
}

async function runAllActiveUsers() {
  console.log("[scheduler] Checking for active users...");

  const { data: connections, error } = await supabase
    .from("instagram_connections")
    .select("user_id")
    .in("status", ["connected", "connecting"])
    .not("access_token", "is", null)
    .not("instagram_username", "is", null);

  if (error) {
    console.error("[scheduler] Error fetching users:", error.message);
    return;
  }

  if (!connections?.length) {
    console.log("[scheduler] No active users found");
    return;
  }

  console.log(`[scheduler] Running automation for ${connections.length} users`);

  for (const { user_id } of connections) {
    await runAutomationForUser(user_id);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

module.exports = { runAutomationForUser, runAllActiveUsers };
