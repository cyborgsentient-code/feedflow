/**
 * Instagram OAuth 2.0 handler (Supabase Edge Function)
 *
 * GET  /instagram-auth?action=connect&user_id=<uuid>
 *   → Redirects to Instagram authorization URL
 *
 * GET  /instagram-auth?code=<auth_code>&state=<user_id>
 *   → Exchanges code for token, writes to instagram_connections, redirects to app
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INSTAGRAM_APP_ID     = Deno.env.get("INSTAGRAM_APP_ID")!;
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET")!;
const REDIRECT_URI         = Deno.env.get("INSTAGRAM_REDIRECT_URI")!; // this function's URL
const APP_SCHEME           = Deno.env.get("APP_SCHEME") ?? "feedflow://";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

Deno.serve(async (req) => {
  const url    = new URL(req.url);
  const code   = url.searchParams.get("code");
  const state  = url.searchParams.get("state");   // user_id passed as state
  const action = url.searchParams.get("action");
  const userId = url.searchParams.get("user_id");

  // ── Demo fallback: instant connection without OAuth ──────────────────────
  if (action === "demo" && userId) {
    const db = supabaseAdmin();
    await db.from("instagram_connections").upsert({
      user_id:            userId,
      instagram_user_id:  `demo_user_${userId.slice(0, 8)}`,
      instagram_username: "demo_account",
      access_token:       `demo_token_${crypto.randomUUID()}`,
      status:             "connected",
      connected_at:       new Date().toISOString(),
      connection_error:   null,
      updated_at:         new Date().toISOString(),
    }, { onConflict: "user_id" });
    return Response.json({ ok: true, auth_mode: "demo_fallback", reason: "demo_action_requested" });
  }

  // ── Step 1: initiate — mark connecting, return auth URL ──────────────────
  if (action === "connect" && userId) {
    const db = supabaseAdmin();
    await db.from("instagram_connections").upsert(
      { user_id: userId, status: "connecting", updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

    const authUrl = new URL("https://api.instagram.com/oauth/authorize");
    authUrl.searchParams.set("client_id",     INSTAGRAM_APP_ID);
    authUrl.searchParams.set("redirect_uri",  REDIRECT_URI);
    authUrl.searchParams.set("scope",         "user_profile,user_media");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state",         userId);

    return Response.json({ authUrl: authUrl.toString() });
  }

  // ── Step 2: callback — exchange code for token ────────────────────────────
  if (code && state) {
    const db = supabaseAdmin();
    try {
      // Exchange code → short-lived token
      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: new URLSearchParams({
          client_id:     INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          grant_type:    "authorization_code",
          redirect_uri:  REDIRECT_URI,
          code,
        }),
      });
      if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
      const { access_token, user_id: instagramUserId } = await tokenRes.json();

      // Fetch basic profile
      const profileRes = await fetch(
        `https://graph.instagram.com/${instagramUserId}?fields=id,username&access_token=${access_token}`,
      );
      const profile = profileRes.ok ? await profileRes.json() : { username: null };

      await db.from("instagram_connections").upsert(
        {
          user_id:           state,
          instagram_user_id: String(instagramUserId),
          instagram_username: profile.username ?? null,
          access_token,        // NOTE: encrypt at rest in production
          status:            "connected",
          connected_at:      new Date().toISOString(),
          connection_error:  null,
          updated_at:        new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      // Redirect back to app via deep link
      return Response.redirect(`${APP_SCHEME}instagram-connected`, 302);
    } catch (e) {
      await db.from("instagram_connections").upsert(
        {
          user_id:          state,
          status:           "failed",
          connection_error: e instanceof Error ? e.message : "Unknown error",
          updated_at:       new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      return Response.redirect(`${APP_SCHEME}instagram-failed`, 302);
    }
  }

  return new Response("Not found", { status: 404 });
});
