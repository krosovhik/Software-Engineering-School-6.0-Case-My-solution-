const config = require("./config");
const { scanCycles } = require("./metrics");

function createScanner(db, githubClient, notifier) {
  let intervalId = null;

  async function scanOnce() {
    scanCycles.inc();
    const repos = await db.query("SELECT id, full_name, last_seen_tag FROM repositories");

    for (const repo of repos.rows) {
      let latestTag;
      try {
        latestTag = await githubClient.getLatestReleaseTag(repo.full_name);
      } catch (error) {
        if (error.statusCode === 429) {
          continue;
        }
        throw error;
      }

      if (!latestTag || latestTag === repo.last_seen_tag) {
        continue;
      }

      const subscribers = await db.query(
        `SELECT email FROM subscriptions
         WHERE repository_id = $1 AND is_active = TRUE`,
        [repo.id]
      );

      for (const sub of subscribers.rows) {
        await notifier.sendNewReleaseEmail(sub.email, repo.full_name, latestTag);
      }

      await db.query(
        "UPDATE repositories SET last_seen_tag = $1, updated_at = NOW() WHERE id = $2",
        [latestTag, repo.id]
      );
    }
  }

  function start() {
    if (intervalId) return;
    intervalId = setInterval(() => {
      scanOnce().catch((err) => {
        process.stderr.write(`Scanner error: ${err.message}\n`);
      });
    }, config.scannerIntervalMs);
  }

  function stop() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  }

  return {
    start,
    stop,
    scanOnce
  };
}

module.exports = { createScanner };
