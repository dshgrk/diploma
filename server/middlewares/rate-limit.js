const { createHttpError } = require("../utils/http-error");

const buckets = new Map();

function createRateLimiter({ key = "default", max = 10, windowMs = 60_000, message = "Too many requests" }) {
  return function rateLimit(req, res, next) {
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    const bucketKey = `${key}:${req.ip || "unknown"}`;
    const now = Date.now();
    const current = buckets.get(bucketKey);

    if (!current || current.resetAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (current.count >= max) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      return next(createHttpError(429, "RATE_LIMITED", message));
    }

    current.count += 1;
    buckets.set(bucketKey, current);
    return next();
  };
}

function resetRateLimitBuckets() {
  buckets.clear();
}

module.exports = { createRateLimiter, resetRateLimitBuckets };
