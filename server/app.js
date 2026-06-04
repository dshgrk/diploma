// Файл містить логіку app.
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { env } = require("./config/env");
const { registerApiRoutes } = require("./routes/index");
const { registerPageRoutes } = require("./routes/pages");
const { notFoundHandler } = require("./middlewares/not-found");
const { errorHandler } = require("./middlewares/error-handler");
const { attachSessionUser } = require("./middlewares/session-auth");
const { attachRequestContext } = require("./middlewares/request-context");
const { applySecurityHeaders } = require("./middlewares/security");

// Створює новий запис або чернетку для create app.
function createApp() {
  const app = express();
  app.disable("x-powered-by");

  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(attachRequestContext);
  app.use(applySecurityHeaders);
  app.use(attachSessionUser);

  app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "public", "assets", "images", "product-heart.png"));
  });

  app.use(express.static(path.resolve(process.cwd(), "public")));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        environment: env.nodeEnv
      }
    });
  });

  registerApiRoutes(app);
  registerPageRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
