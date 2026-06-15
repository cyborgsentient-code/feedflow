const { IgApiClient } = require("instagram-private-api");
const { supabase } = require("./supabase");

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

async function loadSession(ig, userId) {
  const { data } = await supabase
    .from("instagram_connections")
    .select("session_data")
    .eq("user_id", userId)
    .single();
  if (data?.session_data) {
    await ig.state.deserialize(data.session_data);
    return true;
  }
  return false;
}

async function saveSession(ig, userId) {
  const serialized = await ig.state.serialize();
  delete serialized.constants; // don't store constants
  await supabase
    .from("instagram_connections")
    .update({ session_data: serialized, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function runSession(userId, igUsername, igPassword, interests) {
  const ig = new IgApiClient();
  ig.state.generateDevice(igUsername);

  const actions = [];

  try {
    const hasSession = await loadSession(ig, userId);

    if (hasSession) {
      console.log(`[${userId}] Resuming saved session for ${igUsername}`);
    } else {
      console.log(`[${userId}] No saved session, logging in as ${igUsername}...`);
      await ig.simulate.preLoginFlow();
      await sleep(2000);
      const loggedInUser = await ig.account.login(igUsername, igPassword);
      await sleep(2000);
      await ig.simulate.postLoginFlow();
      console.log(`[${userId}] Login successful as ${loggedInUser.username}`);
      await saveSession(ig, userId);
    }

    const activeInterests = interests.filter((s) => INTEREST_HASHTAGS[s]);

    for (const slug of activeInterests.slice(0, 3)) {
      const hashtags = INTEREST_HASHTAGS[slug];
      const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];

      try {
        console.log(`[${userId}] Exploring #${hashtag} (${slug})...`);
        const feed = ig.feed.tags(hashtag, "recent");
        const posts = await feed.items();

        actions.push({ type: "search", payload: { topic: slug, tag: hashtag } });

        for (const post of posts.slice(0, 2)) {
          if (!post.has_liked) {
            await ig.media.like({ mediaId: post.id, moduleInfo: { module_name: "hashtag_feed" } });
            actions.push({ type: "like", payload: { topic: slug, tag: hashtag, mediaId: post.id } });
            console.log(`[${userId}] Liked post ${post.id} (#${hashtag})`);
            await sleep(3000 + Math.random() * 2000);
          }
          actions.push({ type: "view", payload: { topic: slug, tag: hashtag, mediaId: post.id } });
        }

        await sleep(2000 + Math.random() * 3000);
      } catch (err) {
        console.error(`[${userId}] Error on #${hashtag}:`, err.message);
        actions.push({ type: "error", payload: { topic: slug, error: err.message } });
      }
    }

    // Save updated session after successful run
    await saveSession(ig, userId);
    return { success: true, actions };

  } catch (err) {
    console.error(`[${userId}] Session error:`, err.message);
    // Clear bad session so next run attempts fresh login
    if (err.message.includes("400") || err.name === "IgCheckpointError") {
      await supabase
        .from("instagram_connections")
        .update({ session_data: null, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
    return { success: false, error: err.message, actions };
  }
}

module.exports = { runSession };
