const { query, pool } = require("./index");

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS repositories (
    id SERIAL PRIMARY KEY,
    full_name TEXT UNIQUE NOT NULL,
    last_seen_tag TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(email, repository_id)
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_subscriptions_active_repo
  ON subscriptions(repository_id)
  WHERE is_active = TRUE;
  `
];

async function migrate() {
  for (const sql of migrations) {
    await query(sql);
  }
}

if (require.main === module) {
  migrate()
    .then(() => {
      process.stdout.write("Migrations completed\n");
    })
    .catch((err) => {
      process.stderr.write(`Migration error: ${err.message}\n`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}

module.exports = { migrate };
