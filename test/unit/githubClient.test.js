const test = require("node:test");
const assert = require("node:assert/strict");
const { parseRepoFullName } = require("../../src/githubClient");

test("parseRepoFullName parses valid owner/repo", () => {
  const result = parseRepoFullName("golang/go");
  assert.deepEqual(result, { owner: "golang", repo: "go" });
});

test("parseRepoFullName throws on invalid format", () => {
  assert.throws(() => parseRepoFullName("golang"), /Invalid repository format/);
});
