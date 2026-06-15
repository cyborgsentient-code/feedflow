const express = require("express");
const { runAutomationForUser, runAllActiveUsers } = require("./scheduler");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || "changeme";

// Auth middleware
function requireSecret(req, res, next) {
  const auth = req.headers["x-api-secret"] || req.query.secret;
  if (auth !== API_SECRET) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// Health check — Railway uses this to confirm the service is running
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "feedflow-automation-server" });
});

// Trigger automation for a specific user (called from the app)
app.post("/automate/:userId", requireSecret, async (req, res) => {
  const { userId } = req.params;
  // Run in background — don't await
  runAutomationForUser(userId).catch(console.error);
  res.json({ status: "started", userId });
});

// Run all active users (called by Railway cron or manually)
app.post("/run-all", requireSecret, async (req, res) => {
  runAllActiveUsers().catch(console.error);
  res.json({ status: "started" });
});

// Connect Instagram — store credentials and trigger first session
app.post("/connect", requireSecret, async (req, res) => {
  const { userId, username, password } = req.body;
  if (!userId || !username || !password) {
    return res.status(400).json({ error: "userId, username, password required" });
  }

  const { supabase } = require("./supabase");

  // Store credentials (access_token used as password storage for demo)
  await supabase.from("instagram_connections").upsert({
    user_id: userId,
    instagram_username: username,
    access_token: password, // plaintext for demo — encrypt in production
    status: "connecting",
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Kick off first session in background
  runAutomationForUser(userId).catch(console.error);

  res.json({ status: "connecting", userId });
});

app.listen(PORT, () => {
  console.log(`Automation server running on port ${PORT}`);

  // Run automation loop every 30 minutes
  const INTERVAL_MS = 30 * 60 * 1000;
  setInterval(() => {
    runAllActiveUsers().catch(console.error);
  }, INTERVAL_MS);

  // Run once on startup after 10s delay
  setTimeout(() => runAllActiveUsers().catch(console.error), 10000);
});
