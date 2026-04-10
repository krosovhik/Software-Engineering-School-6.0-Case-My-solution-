const { createClient } = require("redis");
const config = require("./config");
const db = require("./db");
const { migrate } = require("./db/migrate");
const { createGithubClient } = require("./githubClient");
const { createNotifier } = require("./notifier");
const { createSubscriptionService } = require("./subscriptionService");
const { createScanner } = require("./scanner");
const { createApp } = require("./app");

async function bootstrap() {
  await migrate();

  const redis = createClient({ url: config.redisUrl });
  redis.on("error", (err) => {
    process.stderr.write(`Redis error: ${err.message}\n`);
  });
  await redis.connect();

  const githubClient = createGithubClient(redis);
  const notifier = createNotifier();
  const service = createSubscriptionService(db, githubClient);
  const scanner = createScanner(db, githubClient, notifier);
  const app = createApp({ service, scanner });

  scanner.start();
  const server = app.listen(config.port, () => {
    process.stdout.write(`Server listening on :${config.port}\n`);
  });

  const shutdown = async () => {
    scanner.stop();
    await redis.quit();
    await db.pool.end();
    server.close();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  process.stderr.write(`Fatal startup error: ${err.message}\n`);
  process.exitCode = 1;
});
