const axios = require("axios");
const { AppError } = require("./errors");
const config = require("./config");
const { githubRequests } = require("./metrics");

function parseRepoFullName(fullName) {
  const parts = fullName.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new AppError("Invalid repository format. Use owner/repo", 400);
  }
  return { owner: parts[0], repo: parts[1] };
}

function createGithubClient(redisClient) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const client = axios.create({
    baseURL: config.githubApiBaseUrl,
    headers,
    timeout: 10000
  });

  async function withCache(key, getter) {
    if (!redisClient) return getter();

    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const fresh = await getter();
    await redisClient.setEx(key, 600, JSON.stringify(fresh));
    return fresh;
  }

  async function checkRepoExists(fullName) {
    const { owner, repo } = parseRepoFullName(fullName);
    try {
      const data = await withCache(`repo:${owner}/${repo}`, async () => {
        const response = await client.get(`/repos/${owner}/${repo}`);
        githubRequests.inc({ status: String(response.status) });
        return response.data;
      });
      return data.full_name;
    } catch (error) {
      if (error.response?.status === 404) {
        githubRequests.inc({ status: "404" });
        throw new AppError("Repository not found", 404);
      }
      if (error.response?.status === 429) {
        githubRequests.inc({ status: "429" });
        throw new AppError("GitHub API rate limit exceeded", 429);
      }
      const status = error.response?.status;
      if (status) {
        githubRequests.inc({ status: String(status) });
      }
      throw new AppError("GitHub API request failed", 502);
    }
  }

  async function getLatestReleaseTag(fullName) {
    const { owner, repo } = parseRepoFullName(fullName);
    try {
      const data = await withCache(`release:${owner}/${repo}`, async () => {
        const response = await client.get(`/repos/${owner}/${repo}/releases/latest`);
        githubRequests.inc({ status: String(response.status) });
        return response.data;
      });
      return data.tag_name || null;
    } catch (error) {
      if (error.response?.status === 404) {
        githubRequests.inc({ status: "404" });
        return null;
      }
      if (error.response?.status === 429) {
        githubRequests.inc({ status: "429" });
        throw new AppError("GitHub API rate limit exceeded", 429);
      }
      const status = error.response?.status;
      if (status) {
        githubRequests.inc({ status: String(status) });
      }
      throw new AppError("GitHub API request failed", 502);
    }
  }

  return {
    parseRepoFullName,
    checkRepoExists,
    getLatestReleaseTag
  };
}

module.exports = { createGithubClient, parseRepoFullName };
