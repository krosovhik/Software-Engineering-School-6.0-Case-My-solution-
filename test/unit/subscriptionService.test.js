const test = require("node:test");
const assert = require("node:assert/strict");
const { createSubscriptionService } = require("../../src/subscriptionService");

test("subscribe creates new subscription flow", async () => {
  const db = {
    async query(sql) {
      if (sql.includes("SELECT id, full_name, last_seen_tag FROM repositories")) {
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO repositories")) {
        return { rows: [{ id: 7, full_name: "golang/go", last_seen_tag: "go1.22.0" }] };
      }
      if (sql.includes("SELECT id, is_active FROM subscriptions")) {
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO subscriptions")) {
        return { rows: [{ id: 5, email: "x@y.z", is_active: true }] };
      }
      return { rows: [] };
    }
  };
  const githubClient = {
    async checkRepoExists() {
      return "golang/go";
    },
    async getLatestReleaseTag() {
      return "go1.22.0";
    }
  };
  const service = createSubscriptionService(db, githubClient);
  const result = await service.subscribe("x@y.z", "golang/go");
  assert.equal(result.repository, "golang/go");
  assert.equal(result.is_active, true);
});
