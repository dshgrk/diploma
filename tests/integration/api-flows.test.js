import { createRequire } from "module";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";

const require = createRequire(import.meta.url);
const { db } = require("../../server/db/knex");
const { createApp } = require("../../server/app");
const { resetRateLimitBuckets } = require("../../server/middlewares/rate-limit");

const MIGRATIONS_DIRECTORY = "./db/migrations";
const SEEDS_DIRECTORY = "./db/seeds";

async function resetDatabase() {
  if (db.client.config.client === "sqlite3") {
    await db.raw("PRAGMA foreign_keys = OFF");
    const tables = await db
      .select("name")
      .from("sqlite_master")
      .where("type", "table")
      .whereNotIn("name", ["sqlite_sequence"]);

    for (const table of tables) {
      await db.schema.dropTableIfExists(table.name);
    }

    await db.raw("PRAGMA foreign_keys = ON");
    return;
  }

  await db.migrate.rollback({ directory: MIGRATIONS_DIRECTORY }, true);
}

describe("api flows", () => {
  beforeAll(async () => {
    await resetDatabase();
    await db.migrate.latest({ directory: MIGRATIONS_DIRECTORY });
  });

  beforeEach(async () => {
    await db.seed.run({ directory: SEEDS_DIRECTORY });
  });

  afterEach(() => {
    resetRateLimitBuckets();
  });

  test("session endpoint reports anonymous visitor", async () => {
    const app = createApp();
    const response = await request(app).get("/api/auth/session");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.authenticated).toBe(false);
    expect(response.body.data.user).toBe(null);
  });

  test("registration rejects invalid Ukrainian phone", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/register").send({
      full_name: "Test User",
      email: "new-user@aurora.local",
      password: "password123",
      phone: "12345"
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.phone).toBeTruthy();
  });

  test("registration creates a pending-verification account", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/register").send({
      full_name: "Новий Користувач",
      email: "new-user@aurora.local",
      password: "password123",
      phone: "+380991234567"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.verification_required).toBe(true);
    expect(response.body.data.user.email).toBe("new-user@aurora.local");

    const user = await db("users").where({ email: "new-user@aurora.local" }).first();
    expect(user).toBeTruthy();
    expect(user.email_verified_at).toBeNull();
  });

  test("client login creates a session and logout clears it", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.email).toBe("client@aurora.local");

    const sessionResponse = await agent.get("/api/auth/session");
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.data.authenticated).toBe(true);
    expect(sessionResponse.body.data.user.role).toBe("client");

    const logoutResponse = await agent.post("/api/auth/logout").send({});
    expect(logoutResponse.status).toBe(200);

    const afterLogout = await agent.get("/api/auth/session");
    expect(afterLogout.status).toBe(200);
    expect(afterLogout.body.data.authenticated).toBe(false);
  });

  test("cart endpoint requires authentication", async () => {
    const app = createApp();
    const response = await request(app).get("/api/cart");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  test("authenticated client receives seeded active cart", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    const response = await agent.get("/api/cart");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].title).toBe("Браслет Місяць");
    expect(response.body.data.subtotal_amount).toBeGreaterThan(0);
  });

  test("adding the same ready product updates quantity in cart", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    const seededCart = await agent.get("/api/cart");
    for (const item of seededCart.body.data.items) {
      await agent.delete(`/api/cart/items/${item.id}`);
    }

    await agent.post("/api/cart/items").send({
      item_type: "ready_product",
      product_id: 1,
      quantity: 1,
      configuration: { size: "17" }
    });

    const response = await agent.post("/api/cart/items").send({
      item_type: "ready_product",
      product_id: 1,
      quantity: 2,
      configuration: { size: "17" }
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    const updatedItem = response.body.data.items.find((item) => item.product_id === 1 && item.configuration?.size === "17");
    expect(updatedItem).toBeTruthy();
    expect(updatedItem.quantity).toBe(3);
  });

  test("constructor config exposes active jewelry types", async () => {
    const app = createApp();
    const response = await request(app).get("/api/constructor/config");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.types)).toBe(true);
    expect(response.body.data.types.some((type) => type.code === "ring")).toBe(true);
    expect(response.body.data.types.some((type) => type.code === "bracelet")).toBe(true);
    expect(Array.isArray(response.body.data.variants)).toBe(true);
    expect(response.body.data.variants.length).toBeGreaterThan(0);
  });

  test("checkout endpoint rejects request without required agreements", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    const response = await agent.post("/api/checkout").send({
      customer_name: "Дарина Клієнт",
      email: "client@aurora.local",
      phone: "+380000000002",
      delivery_method: "nova_poshta",
      delivery_address: "Київ, відділення 1",
      accepted_offer: false,
      accepted_return_policy: false
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.accepted_offer).toBeTruthy();
    expect(response.body.error.details.accepted_return_policy).toBeTruthy();
  });

  test("orders endpoints require ownership and authentication", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const anonymousList = await request(app).get("/api/orders/me");
    expect(anonymousList.status).toBe(401);

    await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    const ownOrders = await agent.get("/api/orders/me");
    expect(ownOrders.status).toBe(200);
    expect(Array.isArray(ownOrders.body.data)).toBe(true);
    expect(ownOrders.body.data.length).toBeGreaterThan(0);

    const missingOrder = await agent.get("/api/orders/99999");
    expect(missingOrder.status).toBe(404);
    expect(missingOrder.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  test("client cannot access admin orders endpoints", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    const response = await agent.get("/api/admin/orders");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("admin login grants access to orders dashboard and order details", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/admin/login").send({
      email: "admin@aurora.local",
      password: "password123"
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.role).toBe("admin");

    const listResponse = await agent.get("/api/admin/orders");
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data.orders)).toBe(true);
    expect(listResponse.body.data.orders.length).toBeGreaterThan(0);

    const firstOrderId = listResponse.body.data.orders[0].id;
    const detailsResponse = await agent.get(`/api/admin/orders/${firstOrderId}`);
    expect(detailsResponse.status).toBe(200);
    expect(detailsResponse.body.data.id).toBe(firstOrderId);
    expect(Array.isArray(detailsResponse.body.data.items)).toBe(true);
  });
});
