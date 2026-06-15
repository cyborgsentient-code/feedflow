import os
import logging
import threading
import time
from flask import Flask, request, jsonify
from scheduler import run_all_active_users, run_automation_for_user

logging.basicConfig(level=logging.INFO, format="%(message)s")

app = Flask(__name__)
PORT = int(os.environ.get("PORT", 3000))
API_SECRET = os.environ.get("API_SECRET", "changeme")


def require_secret():
    auth = request.headers.get("x-api-secret") or request.args.get("secret")
    return auth == API_SECRET


@app.get("/")
def health():
    return jsonify({"status": "ok", "service": "feedflow-automation-server"})


@app.post("/automate/<user_id>")
def automate_user(user_id):
    if not require_secret():
        return jsonify({"error": "Unauthorized"}), 401
    threading.Thread(target=run_automation_for_user, args=(user_id,), daemon=True).start()
    return jsonify({"status": "started", "userId": user_id})


@app.post("/run-all")
def run_all():
    if not require_secret():
        return jsonify({"error": "Unauthorized"}), 401
    threading.Thread(target=run_all_active_users, daemon=True).start()
    return jsonify({"status": "started"})


@app.post("/connect")
def connect():
    if not require_secret():
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json or {}
    user_id = data.get("userId")
    username = data.get("username")
    password = data.get("password")
    if not all([user_id, username, password]):
        return jsonify({"error": "userId, username, password required"}), 400

    from supabase_client import supabase
    supabase.table("instagram_connections").upsert({
        "user_id": user_id,
        "instagram_username": username,
        "access_token": password,
        "status": "connecting",
        "session_data": None,
        "updated_at": "now()",
    }, on_conflict="user_id").execute()

    threading.Thread(target=run_automation_for_user, args=(user_id,), daemon=True).start()
    return jsonify({"status": "connecting", "userId": user_id})


def scheduler_loop():
    """Run all active users every 30 minutes."""
    time.sleep(10)  # wait 10s after startup
    while True:
        run_all_active_users()
        time.sleep(30 * 60)


if __name__ == "__main__":
    threading.Thread(target=scheduler_loop, daemon=True).start()
    print(f"Automation server running on port {PORT}")
    app.run(host="0.0.0.0", port=PORT)
