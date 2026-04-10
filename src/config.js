const dotenv = require("dotenv");

dotenv.config();

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

module.exports = {
  port: toInt(process.env.PORT, 3000),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/genesis",
  githubApiBaseUrl: process.env.GITHUB_API_BASE_URL || "https://api.github.com",
  githubToken: process.env.GITHUB_TOKEN || "",
  scannerIntervalMs: toInt(process.env.SCANNER_INTERVAL_MS, 60000),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: toInt(process.env.SMTP_PORT, 1025),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "noreply@example.com",
  apiKey: process.env.API_KEY || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379"
};
