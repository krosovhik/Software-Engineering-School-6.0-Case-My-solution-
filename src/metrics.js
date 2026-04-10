const client = require("prom-client");

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const githubRequests = new client.Counter({
  name: "github_api_requests_total",
  help: "Count of GitHub API requests",
  labelNames: ["status"]
});

const emailsSent = new client.Counter({
  name: "emails_sent_total",
  help: "Count of successfully sent emails"
});

const scanCycles = new client.Counter({
  name: "scanner_cycles_total",
  help: "Count of scanner cycles"
});

registry.registerMetric(githubRequests);
registry.registerMetric(emailsSent);
registry.registerMetric(scanCycles);

module.exports = {
  registry,
  githubRequests,
  emailsSent,
  scanCycles
};
