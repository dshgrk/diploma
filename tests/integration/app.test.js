import { createRequire } from "module";
import { afterEach, describe, expect, test } from "vitest";
import request from "supertest";

const require = createRequire(import.meta.url);
const { createApp } = require("../../server/app");
const { resetRateLimitBuckets } = require("../../server/middlewares/rate-limit");

afterEach(() => {
  resetRateLimitBuckets();
});

describe("app integration", () => {
  test("returns health response", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  test("returns 404 for unknown api route", async () => {
    const app = createApp();
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("adds baseline security headers", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  test("rate limits repeated auth attempts", async () => {
    const app = createApp();

    for (let index = 0; index < 8; index += 1) {
      const response = await request(app).post("/api/auth/login").send({});
      expect(response.status).toBe(422);
    }

    const limited = await request(app).post("/api/auth/login").send({});
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("RATE_LIMITED");
  });
});
