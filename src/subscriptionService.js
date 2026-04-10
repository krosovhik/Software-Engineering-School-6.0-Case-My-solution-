const { AppError } = require("./errors");

function createSubscriptionService(db, githubClient) {
  async function ensureRepository(fullName) {
    const normalized = await githubClient.checkRepoExists(fullName);
    const existing = await db.query(
      "SELECT id, full_name, last_seen_tag FROM repositories WHERE full_name = $1",
      [normalized]
    );
    if (existing.rows[0]) return existing.rows[0];

    const tag = await githubClient.getLatestReleaseTag(normalized);
    const inserted = await db.query(
      "INSERT INTO repositories(full_name, last_seen_tag) VALUES ($1, $2) RETURNING id, full_name, last_seen_tag",
      [normalized, tag]
    );
    return inserted.rows[0];
  }

  async function subscribe(email, repository) {
    if (!email || !repository) {
      throw new AppError("email and repository are required", 400);
    }

    const repo = await ensureRepository(repository);
    const existing = await db.query(
      "SELECT id, is_active FROM subscriptions WHERE email = $1 AND repository_id = $2",
      [email, repo.id]
    );

    if (existing.rows[0] && existing.rows[0].is_active) {
      return {
        id: existing.rows[0].id,
        email,
        repository: repo.full_name,
        is_active: true
      };
    }

    if (existing.rows[0] && !existing.rows[0].is_active) {
      const reactivated = await db.query(
        "UPDATE subscriptions SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, email, is_active",
        [existing.rows[0].id]
      );
      return {
        id: reactivated.rows[0].id,
        email: reactivated.rows[0].email,
        repository: repo.full_name,
        is_active: reactivated.rows[0].is_active
      };
    }

    const inserted = await db.query(
      "INSERT INTO subscriptions(email, repository_id, is_active) VALUES ($1, $2, TRUE) RETURNING id, email, is_active",
      [email, repo.id]
    );
    return {
      id: inserted.rows[0].id,
      email: inserted.rows[0].email,
      repository: repo.full_name,
      is_active: inserted.rows[0].is_active
    };
  }

  async function unsubscribe(email, repository) {
    if (!email || !repository) {
      throw new AppError("email and repository are required", 400);
    }

    const repo = await db.query("SELECT id FROM repositories WHERE full_name = $1", [
      repository
    ]);
    if (!repo.rows[0]) {
      throw new AppError("Subscription not found", 404);
    }

    const result = await db.query(
      "UPDATE subscriptions SET is_active = FALSE, updated_at = NOW() WHERE email = $1 AND repository_id = $2 AND is_active = TRUE RETURNING id",
      [email, repo.rows[0].id]
    );

    if (!result.rows[0]) {
      throw new AppError("Subscription not found", 404);
    }
  }

  async function listByEmail(email) {
    if (!email) throw new AppError("email is required", 400);
    const result = await db.query(
      `SELECT s.id, s.email, s.is_active, r.full_name AS repository
       FROM subscriptions s
       JOIN repositories r ON r.id = s.repository_id
       WHERE s.email = $1`,
      [email]
    );
    return result.rows;
  }

  return {
    subscribe,
    unsubscribe,
    listByEmail
  };
}

module.exports = { createSubscriptionService };
