const { IgApiClient } = require("instagram-private-api");

// Hashtags mapped to interest slugs
const INTEREST_HASHTAGS = {
  technology:  ["technology", "tech", "coding", "programming", "software"],
  design:      ["design", "uidesign", "uxdesign", "graphicdesign", "creative"],
  fitness:     ["fitness", "workout", "gym", "health", "training"],
  food:        ["food", "foodie", "cooking", "recipe", "delicious"],
  travel:      ["travel", "wanderlust", "adventure", "explore", "trip"],
  music:       ["music", "musician", "song", "hiphop", "indie"],
  photography: ["photography", "photo", "photographer", "portrait", "landscape"],
  gaming:      ["gaming", "gamer", "videogames", "ps5", "pcgaming"],
  business:    ["business", "entrepreneur", "startup", "marketing", "success"],
  art:         ["art", "artist", "artwork", "illustration", "digitalart"],
  science:     ["science", "research", "physics", "biology", "space"],
  fashion:     ["fashion", "style", "outfit", "ootd", "streetstyle"],
};

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Run one automation session for a user via Instagram private API.
 * Logs in, browses hashtag feeds, and likes posts to signal interest.
 */
async function runSession(userId, igUsername, igPassword, interests) {
  const ig = new IgApiClient();
  ig.state.generateDevice(igUsername);

  const actions = [];

  try {
    console.log(`[${userId}] Logging in as ${igUsername}...`);
    await ig.simulate.preLoginFlow();
    await ig.account.login(igUsername, igPassword);
    await ig.simulate.postLoginFlow();
    console.log(`[${userId}] Login successful`);

    const activeInterests = interests.filter((s) => INTEREST_HASHTAGS[s]);

    for (const slug of activeInterests.slice(0, 3)) {
      const hashtags = INTEREST_HASHTAGS[slug];
      const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];

      try {
        console.log(`[${userId}] Exploring #${hashtag} (${slug})...`);
        const feed = ig.feed.tags(hashtag, "recent");
        const posts = await feed.items();

        actions.push({ type: "search", payload: { topic: slug, tag: hashtag } });

        // Like up to 2 posts per hashtag
        for (const post of posts.slice(0, 2)) {
          if (!post.has_liked) {
            await ig.media.like({ mediaId: post.id, moduleInfo: { module_name: "hashtag_feed" } });
            actions.push({ type: "like", payload: { topic: slug, tag: hashtag, mediaId: post.id } });
            console.log(`[${userId}] Liked post ${post.id} (#${hashtag})`);
            await sleep(3000 + Math.random() * 2000); // human-like delay
          }
          actions.push({ type: "view", payload: { topic: slug, tag: hashtag, mediaId: post.id } });
        }

        await sleep(2000 + Math.random() * 3000);
      } catch (err) {
        console.error(`[${userId}] Error on #${hashtag}:`, err.message);
        actions.push({ type: "error", payload: { topic: slug, error: err.message } });
      }
    }

    return { success: true, actions };

  } catch (err) {
    console.error(`[${userId}] Session error:`, err.message);
    return { success: false, error: err.message, actions };
  }
}

module.exports = { runSession };
