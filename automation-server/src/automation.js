const { chromium } = require("playwright");

// Hashtags mapped to interest slugs
const INTEREST_HASHTAGS = {
  technology:   ["technology", "tech", "coding", "programming", "software"],
  design:       ["design", "uidesign", "uxdesign", "graphicdesign", "creative"],
  fitness:      ["fitness", "workout", "gym", "health", "training"],
  food:         ["food", "foodie", "cooking", "recipe", "delicious"],
  travel:       ["travel", "wanderlust", "adventure", "explore", "trip"],
  music:        ["music", "musician", "song", "hiphop", "indie"],
  photography:  ["photography", "photo", "photographer", "portrait", "landscape"],
  gaming:       ["gaming", "gamer", "videogames", "ps5", "pcgaming"],
  business:     ["business", "entrepreneur", "startup", "marketing", "success"],
  art:          ["art", "artist", "artwork", "illustration", "digitalart"],
  science:      ["science", "research", "physics", "biology", "space"],
  fashion:      ["fashion", "style", "outfit", "ootd", "streetstyle"],
};

/**
 * Run one automation session for a user.
 * Logs into Instagram, searches their interest hashtags,
 * views and likes posts to signal interest to the algorithm.
 */
async function runSession(userId, igUsername, igPassword, interests) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    viewport: { width: 390, height: 844 },
  });

  const page = await context.newPage();
  const actions = [];

  try {
    // ── Login ────────────────────────────────────────────────────────────────
    await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Accept cookies if prompted
    const cookieBtn = page.locator("text=Allow all cookies").first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.fill('input[name="username"]', igUsername);
    await page.fill('input[name="password"]', igPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);

    // Dismiss "Save login info" dialog if it appears
    const notNow = page.locator("text=Not now").first();
    if (await notNow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notNow.click();
      await page.waitForTimeout(1000);
    }

    // Dismiss notifications dialog if it appears
    const notNow2 = page.locator("text=Not Now").first();
    if (await notNow2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notNow2.click();
      await page.waitForTimeout(1000);
    }

    // ── Verify login succeeded ───────────────────────────────────────────────
    const currentUrl = page.url();
    const pageText = await page.textContent("body").catch(() => "");
    console.log(`[${userId}] Post-login URL: ${currentUrl}`);
    console.log(`[${userId}] Page snippet: ${pageText.slice(0, 300)}`);

    const loginFailed =
      currentUrl.includes("/accounts/login") ||
      currentUrl.includes("/challenge") ||
      currentUrl.includes("/two_factor") ||
      pageText.includes("your password was incorrect") ||
      pageText.includes("verify your identity") ||
      pageText.includes("suspicious login");

    if (loginFailed) {
      return { success: false, error: `Login failed. URL: ${currentUrl}`, actions };
    }

    // ── For each interest, explore hashtag ───────────────────────────────────
    const activeInterests = interests.filter((s) => INTEREST_HASHTAGS[s]);

    for (const slug of activeInterests.slice(0, 3)) {
      const hashtags = INTEREST_HASHTAGS[slug];
      const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)];

      try {
        await page.goto(`https://www.instagram.com/explore/tags/${hashtag}/`, {
          waitUntil: "networkidle",
          timeout: 15000,
        });
        await page.waitForTimeout(2000);

        actions.push({ type: "search", payload: { topic: slug, tag: hashtag } });

        // Click first post in the grid
        const posts = page.locator("article a").first();
        if (await posts.isVisible({ timeout: 5000 }).catch(() => false)) {
          await posts.click();
          await page.waitForTimeout(3000);

          actions.push({ type: "view", payload: { topic: slug, tag: hashtag } });

          // Like the post
          const likeBtn = page.locator('svg[aria-label="Like"]').first();
          if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await likeBtn.click();
            await page.waitForTimeout(1500);
            actions.push({ type: "like", payload: { topic: slug, tag: hashtag } });
          }

          // Close post
          const closeBtn = page.locator('svg[aria-label="Close"]').first();
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // Scroll to trigger more feed signals
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(2000);

      } catch (err) {
        actions.push({ type: "error", payload: { topic: slug, error: err.message } });
      }
    }

    return { success: true, actions };

  } catch (err) {
    return { success: false, error: err.message, actions };
  } finally {
    await browser.close();
  }
}

module.exports = { runSession };
