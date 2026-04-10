const test = require("node:test");
const assert = require("node:assert/strict");
const { createScanner } = require("../../src/scanner");

test("scanner sends notifications and updates tag when new release found", async () => {
  const sent = [];
  const updates = [];
  const db = {
    async query(sql) {
      if (sql.includes("SELECT id, full_name, last_seen_tag FROM repositories")) {
        return { rows: [{ id: 1, full_name: "owner/repo", last_seen_tag: "v1.0.0" }] };
      }
      if (sql.includes("SELECT email FROM subscriptions")) {
        return { rows: [{ email: "a@test.com" }, { email: "b@test.com" }] };
      }
      if (sql.includes("UPDATE repositories SET last_seen_tag")) {
        updates.push(true);
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const githubClient = {
    async getLatestReleaseTag() {
      return "v1.1.0";
    }
  };
  const notifier = {
    async sendNewReleaseEmail(email, repo, tag) {
      sent.push({ email, repo, tag });
    }
  };

  const scanner = createScanner(db, githubClient, notifier);
  await scanner.scanOnce();

  assert.equal(sent.length, 2);
  assert.equal(updates.length, 1);
});
