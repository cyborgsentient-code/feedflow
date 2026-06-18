import logging
from supabase_client import supabase
from automation import run_session

logger = logging.getLogger(__name__)
running_sessions = set()


def log_action(user_id: str, action_type: str, payload: dict, category_slug: str | None = None):
    try:
        row = {
            "user_id": user_id,
            "action_type": action_type,
            "metadata": payload,
            "source": "railway-automation-server",
        }
        if category_slug:
            row["category_slug"] = category_slug
        supabase.table("automation_logs").insert(row).execute()
    except Exception as e:
        logger.error(f"logAction: {e}")


def update_connection_status(user_id: str, status: str):
    try:
        supabase.table("instagram_connections") \
            .update({"status": status, "updated_at": "now()"}) \
            .eq("user_id", user_id).execute()
    except Exception as e:
        logger.error(f"updateConnectionStatus: {e}")


def get_user_data(user_id: str):
    conn_res = supabase.table("instagram_connections") \
        .select("instagram_username, access_token, status") \
        .eq("user_id", user_id).single().execute()
    conn = conn_res.data

    interests = []
    try:
        profile_res = supabase.table("profiles") \
            .select("interests").eq("id", user_id).single().execute()
        interests = (profile_res.data or {}).get("interests") or []
    except Exception:
        pass

    if not interests:
        prefs_res = supabase.table("user_preferences") \
            .select("interest_categories(slug)").eq("user_id", user_id).execute()
        interests = [
            p["interest_categories"]["slug"]
            for p in (prefs_res.data or [])
            if p.get("interest_categories", {}).get("slug")
        ]

    return conn, interests


def run_automation_for_user(user_id: str):
    if user_id in running_sessions:
        logger.info(f"[{user_id}] Session already running, skipping")
        return

    running_sessions.add(user_id)
    logger.info(f"[{user_id}] Starting automation session")

    try:
        conn, interests = get_user_data(user_id)

        if not conn or not conn.get("instagram_username") or not conn.get("access_token"):
            logger.info(f"[{user_id}] No Instagram credentials found")
            return

        if not interests:
            logger.info(f"[{user_id}] No interests set")
            return

        logger.info(f"[{user_id}] Interests: {', '.join(interests)}")
        log_action(user_id, "snapshot_created", {"message": "Automation session started"})

        result = run_session(user_id, conn["instagram_username"], conn["access_token"], interests, log_action)

        update_connection_status(user_id, "connected" if result["success"] else "failed")
        log_action(user_id, "reinforcement_calculated", {
            "actions_count": result.get("actions_count", 0),
            "success": result["success"],
        })

        logger.info(f"[{user_id}] Session complete — {result.get('actions_count', 0)} actions")

    except Exception as e:
        logger.error(f"[{user_id}] Session error: {e}")
        log_action(user_id, "error", {"error": str(e)})
        update_connection_status(user_id, "failed")
    finally:
        running_sessions.discard(user_id)


def run_all_active_users():
    logger.info("[scheduler] Checking for active users...")
    res = supabase.table("instagram_connections") \
        .select("user_id") \
        .in_("status", ["connected", "connecting"]) \
        .not_.is_("access_token", "null") \
        .not_.is_("instagram_username", "null") \
        .execute()

    connections = res.data or []
    if not connections:
        logger.info("[scheduler] No active users found")
        return

    # Filter out users who have paused automation
    user_ids = [row["user_id"] for row in connections]
    settings_res = supabase.table("user_settings") \
        .select("user_id, automation_enabled") \
        .in_("user_id", user_ids) \
        .execute()
    paused = {
        row["user_id"]
        for row in (settings_res.data or [])
        if row.get("automation_enabled") is False
    }

    active = [row for row in connections if row["user_id"] not in paused]
    logger.info(f"[scheduler] Running automation for {len(active)} users ({len(paused)} paused)")
    for row in active:
        run_automation_for_user(row["user_id"])
        import time; time.sleep(5)
