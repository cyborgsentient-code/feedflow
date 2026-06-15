import os
import json
import random
import time
import logging
from instagrapi import Client
from instagrapi.exceptions import (
    LoginRequired, ChallengeRequired, TwoFactorRequired,
    BadPassword, UserNotFound, ClientError
)
from supabase_client import supabase

logger = logging.getLogger(__name__)

INTEREST_HASHTAGS = {
    "technology":  ["technology", "tech", "coding", "programming", "software"],
    "design":      ["design", "uidesign", "uxdesign", "graphicdesign", "creative"],
    "fitness":     ["fitness", "workout", "gym", "health", "training"],
    "food":        ["food", "foodie", "cooking", "recipe", "delicious"],
    "travel":      ["travel", "wanderlust", "adventure", "explore", "trip"],
    "music":       ["music", "musician", "song", "hiphop", "indie"],
    "photography": ["photography", "photo", "photographer", "portrait", "landscape"],
    "gaming":      ["gaming", "gamer", "videogames", "ps5", "pcgaming"],
    "business":    ["business", "entrepreneur", "startup", "marketing", "success"],
    "art":         ["art", "artist", "artwork", "illustration", "digitalart"],
    "science":     ["science", "research", "physics", "biology", "space"],
    "fashion":     ["fashion", "style", "outfit", "ootd", "streetstyle"],
}


def load_session(cl: Client, user_id: str) -> bool:
    res = supabase.table("instagram_connections") \
        .select("session_data") \
        .eq("user_id", user_id) \
        .single() \
        .execute()
    session_data = res.data.get("session_data") if res.data else None
    if session_data:
        try:
            cl.set_settings(session_data if isinstance(session_data, dict) else json.loads(session_data))
            cl.get_timeline_feed()  # verify session is still valid
            return True
        except Exception as e:
            logger.warning(f"[{user_id}] Saved session invalid: {e}")
    return False


def save_session(cl: Client, user_id: str):
    settings = cl.get_settings()
    supabase.table("instagram_connections") \
        .update({"session_data": settings, "updated_at": "now()"}) \
        .eq("user_id", user_id) \
        .execute()


def run_session(user_id: str, ig_username: str, ig_password: str, interests: list) -> dict:
    cl = Client()
    cl.set_proxy("http://tmpcpzzl:b88dexouv37s@38.154.203.95:5863/")
    cl.delay_range = [2, 5]  # human-like delays between requests
    actions = []

    try:
        if load_session(cl, user_id):
            logger.info(f"[{user_id}] Resumed saved session for {ig_username}")
        else:
            logger.info(f"[{user_id}] Logging in as {ig_username}...")
            cl.login(ig_username, ig_password)
            logger.info(f"[{user_id}] Login successful")
            save_session(cl, user_id)

        active_interests = [s for s in interests if s in INTEREST_HASHTAGS]

        for slug in active_interests[:3]:
            hashtag = random.choice(INTEREST_HASHTAGS[slug])
            try:
                logger.info(f"[{user_id}] Exploring #{hashtag} ({slug})...")
                medias = cl.hashtag_medias_recent(hashtag, amount=6)
                actions.append({"type": "search", "payload": {"topic": slug, "tag": hashtag}})

                for media in medias[:2]:
                    cl.media_like(media.id)
                    actions.append({"type": "like", "payload": {"topic": slug, "tag": hashtag, "mediaId": str(media.id)}})
                    logger.info(f"[{user_id}] Liked {media.id} (#{hashtag})")
                    actions.append({"type": "view", "payload": {"topic": slug, "tag": hashtag, "mediaId": str(media.id)}})
                    time.sleep(random.uniform(3, 6))

                time.sleep(random.uniform(2, 4))

            except Exception as e:
                logger.error(f"[{user_id}] Error on #{hashtag}: {e}")
                actions.append({"type": "error", "payload": {"topic": slug, "error": str(e)}})

        save_session(cl, user_id)
        return {"success": True, "actions": actions}

    except (ChallengeRequired, TwoFactorRequired) as e:
        logger.error(f"[{user_id}] Challenge required: {e}")
        # Clear session so next attempt tries fresh login
        supabase.table("instagram_connections") \
            .update({"session_data": None}) \
            .eq("user_id", user_id).execute()
        return {"success": False, "error": str(e), "actions": actions}

    except (BadPassword, LoginRequired) as e:
        logger.error(f"[{user_id}] Login error: {e}")
        supabase.table("instagram_connections") \
            .update({"session_data": None}) \
            .eq("user_id", user_id).execute()
        return {"success": False, "error": str(e), "actions": actions}

    except Exception as e:
        logger.error(f"[{user_id}] Session error: {e}")
        return {"success": False, "error": str(e), "actions": actions}
