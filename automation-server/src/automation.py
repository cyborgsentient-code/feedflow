import random
import time
import logging

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
    "ai":          ["artificialintelligence", "machinelearning", "deeplearning", "aitools", "chatgpt"],
    "startups":    ["startups", "founder", "venturecapital", "productlaunch", "saas"],
    "finance":     ["finance", "investing", "stockmarket", "crypto", "personalfinance"],
    "health":      ["health", "wellness", "mentalhealth", "nutrition", "mindfulness"],
    "education":   ["education", "learning", "onlinecourse", "study", "knowledge"],
}

def _fake_media_id() -> str:
    return str(random.randint(3_000_000_000_000_000_000, 3_999_999_999_999_999_999))

def run_session(user_id: str, ig_username: str, ig_password: str, interests: list) -> dict:
    """
    Simulated automation session. Generates realistic action logs
    per interest category without hitting Instagram's API.
    """
    actions = []
    active = [s for s in interests if s in INTEREST_HASHTAGS][:3]

    logger.info(f"[{user_id}] Starting simulated session for @{ig_username}, interests: {active}")

    for slug in active:
        hashtag = random.choice(INTEREST_HASHTAGS[slug])
        logger.info(f"[{user_id}] Exploring #{hashtag} ({slug})")

        # search action
        actions.append({"type": "search", "payload": {"topic": slug, "tag": hashtag}, "category_slug": slug})
        time.sleep(random.uniform(1.5, 3.0))

        # view + like 2 posts
        for _ in range(2):
            media_id = _fake_media_id()
            actions.append({"type": "view",  "payload": {"topic": slug, "tag": hashtag, "mediaId": media_id}, "category_slug": slug})
            time.sleep(random.uniform(2.0, 4.0))
            actions.append({"type": "like",  "payload": {"topic": slug, "tag": hashtag, "mediaId": media_id}, "category_slug": slug})
            logger.info(f"[{user_id}] Liked post {media_id} (#{hashtag})")
            time.sleep(random.uniform(1.5, 3.5))

        time.sleep(random.uniform(1.0, 2.0))

    logger.info(f"[{user_id}] Session complete — {len(actions)} actions")
    return {"success": True, "actions": actions}
