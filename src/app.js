const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { AppError } = require("./errors");
const { registry } = require("./metrics");

function createApp({ service, scanner }) {
  const app = express();
  app.use(express.json());
  app.use(express.static("public"));

  if (process.env.API_KEY) {
    app.use((req, res, next) => {
      if (
        req.path === "/health" ||
        req.path === "/metrics" ||
        req.path.startsWith("/docs") ||
        req.path === "/"
      ) {
        return next();
      }
      const header = req.get("x-api-key");
      if (!header || header !== process.env.API_KEY) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return next();
    });
  }

  const swaggerDocument = YAML.load("./swagger.yaml");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", registry.contentType);
    res.send(await registry.metrics());
  });

  app.post("/subscriptions", async (req, res, next) => {
    try {
      const { email, repository } = req.body || {};
      const result = await service.subscribe(email, repository);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/subscriptions", async (req, res, next) => {
    try {
      const { email, repository } = req.body || {};
      await service.unsubscribe(email, repository);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/subscriptions", async (req, res, next) => {
    try {
      const items = await service.listByEmail(req.query.email);
      res.json({ items });
    } catch (error) {
      next(error);
    }
  });

  app.post("/scanner/run", async (_req, res, next) => {
    try {
      await scanner.scanOnce();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };
