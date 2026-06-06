// Файл містить автоматичні перевірки ключових сценаріїв системи.
import { createRequire } from "module";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";

const require = createRequire(import.meta.url);
const { db } = require("../../server/db/knex");
const { createApp } = require("../../server/app");
const { resetRateLimitBuckets } = require("../../server/middlewares/rate-limit");

const MIGRATIONS_DIRECTORY = "./db/migrations";
const SEEDS_DIRECTORY = "./db/seeds";

// Виконує локальну логіку reset database для модуля автоматичних тестів.
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

  test("registration accepts payload without phone", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/register").send({
      full_name: "Test User",
      email: "new-user@aurora.local",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.phone).toBeNull();
  });

  test("registration creates a pending-verification account", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/register").send({
      full_name: "Новий Користувач",
      email: "new-user@aurora.local",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.verification_required).toBe(true);
    expect(response.body.data.user.email).toBe("new-user@aurora.local");

    const user = await db("users").where({ email: "new-user@aurora.local" }).first();
    expect(user).toBeTruthy();
    expect(user.email_verified_at).toBeNull();
    expect(user.phone).toBeNull();
  });

  test("registration still validates full name, email and password", async () => {
    const app = createApp();
    const response = await request(app).post("/api/auth/register").send({
      full_name: "   ",
      email: "normalized-user",
      password: "123"
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.full_name).toBeTruthy();
    expect(response.body.error.details.email).toBeTruthy();
    expect(response.body.error.details.password).toBeTruthy();
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
    expect(response.body.data.variants.map((variant) => variant.code)).toEqual(
      expect.arrayContaining([
        "ring-trinity",
        "ring-solitaire",
        "ring-duet",
        "bracelet-orbit",
        "bracelet-line",
        "bracelet-duet",
        "pendant-heart",
        "pendant-moon",
        "pendant-drop",
        "earrings-drop",
        "earrings-stud",
        "earrings-arc"
      ])
    );
    expect(response.body.data.variants.find((variant) => variant.code === "ring-solitaire")?.price_delta).toBe(300);
    expect(response.body.data.slotsByVariant["102"].map((slot) => slot.code)).toEqual(["center"]);
    expect(response.body.data.slotsByVariant["103"].map((slot) => slot.code)).toEqual(["left", "right"]);
    expect(response.body.data.slotsByVariant["202"].map((slot) => slot.code)).toEqual(["left", "center", "right"]);
    expect(response.body.data.slotsByVariant["203"].map((slot) => slot.code)).toEqual(["left", "right"]);
    expect(response.body.data.slotsByVariant["402"].map((slot) => slot.code)).toEqual(["left", "right"]);
    expect(response.body.data.slotsByVariant["403"].map((slot) => slot.code)).toEqual(["left", "right"]);
    expect(
      response.body.data.variantStoneMatrix.filter((entry) => entry.variant_id === 102).map((entry) => entry.stone_id).sort((left, right) => left - right)
    ).toEqual([1, 2, 3, 4, 5, 6, 8]);
  });

  test("constructor exposes lazy public endpoints for types, variants and variant options", async () => {
    const app = createApp();

    const typesResponse = await request(app).get("/api/constructor/types");
    const variantsResponse = await request(app).get("/api/constructor/variants").query({ type_id: 1 });
    const optionsResponse = await request(app).get("/api/constructor/variants/103/options");

    expect(typesResponse.status).toBe(200);
    expect(typesResponse.body.data.types.map((type) => type.code)).toEqual(expect.arrayContaining(["ring", "bracelet", "pendant", "earrings"]));
    expect(variantsResponse.status).toBe(200);
    expect(variantsResponse.body.data.variants.map((variant) => variant.code)).toEqual(["ring-solitaire", "ring-duet", "ring-trinity"]);
    expect(optionsResponse.status).toBe(200);
    expect(optionsResponse.body.data.variant.code).toBe("ring-duet");
    expect(optionsResponse.body.data.type.code).toBe("ring");
    expect(optionsResponse.body.data.slots.map((slot) => slot.code)).toEqual(["left", "right"]);
    expect(optionsResponse.body.data.stones.map((stone) => stone.code)).toContain("diamond");
    expect(optionsResponse.body.data).not.toHaveProperty("slotsByVariant");
  });

  test("checkout endpoint rejects request without accepted offer", async () => {
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
  });

  test("checkout endpoint accepts payload without legacy return policy flag", async () => {
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
      accepted_offer: true
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order_id).toBeTruthy();
  });

  test("checkout endpoint rejects invalid phone and blank address", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    const response = await agent.post("/api/checkout").send({
      customer_name: "Дарина Клієнт",
      email: "client@aurora.local",
      phone: "12345",
      delivery_method: "nova_poshta",
      delivery_address: "   ",
      accepted_offer: true,
      accepted_return_policy: true
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.phone).toBeTruthy();
    expect(response.body.error.details.delivery_address).toBeTruthy();
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

  test("admin can create a ready product with real catalog filter values and derived type", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/admin/login").send({
      email: "admin@aurora.local",
      password: "password123"
    });

    const response = await agent.post("/api/admin/catalog/products").send({
      jewelry_type_id: 2,
      type: "Ring",
      sku: "AUR-TEST-BRACELET",
      slug: "aur-test-bracelet",
      name_uk: "Тестовий браслет",
      name_en: "Test bracelet",
      description_uk: "Опис тестового браслета",
      description_en: "Description for the test bracelet",
      price: 12500,
      currency: "UAH",
      is_active: true,
      image_asset_path: "",
      image_alt_uk: "Тестовий браслет",
      image_alt_en: "Test bracelet",
      metal: "Rose Gold",
      stoneType: "Pearl",
      stoneShape: "Marquise",
      stoneColor: "Champagne",
      stoneSize: "1.2 ct",
      braceletLength: "18 cm",
      ringSize: "17",
      ringType: "Romantic"
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.jewelry_type_id).toBe(2);
    expect(response.body.data.filters.type).toBe("Bracelet");
    expect(response.body.data.filters.stoneType).toBe("Pearl");
    expect(response.body.data.filters.stoneShape).toBe("Marquise");
    expect(response.body.data.filters.stoneColor).toBe("Champagne");
    expect(response.body.data.filters.stoneSize).toBe("1.2 ct");
    expect(response.body.data.filters.braceletLength).toBe("18 cm");
    expect(response.body.data.filters.ringSize).toBeNull();
    expect(response.body.data.filters.ringType).toBeNull();
  });

  test("admin can update an existing ready product with real seeded values without conflicting type state", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/admin/login").send({
      email: "admin@aurora.local",
      password: "password123"
    });

    const listResponse = await agent.get("/api/admin/catalog/products");
    expect(listResponse.status).toBe(200);

    const ringProduct = listResponse.body.data.find((product) => product.jewelry_type_code === "ring");
    expect(ringProduct).toBeTruthy();

    const response = await agent.patch(`/api/admin/catalog/products/${ringProduct.id}`).send({
      jewelry_type_id: ringProduct.jewelry_type_id,
      type: "Pendant",
      sku: ringProduct.sku,
      slug: ringProduct.slug,
      name_uk: ringProduct.name_uk,
      name_en: ringProduct.name_en,
      description_uk: ringProduct.description_uk,
      description_en: ringProduct.description_en,
      price: ringProduct.price,
      currency: ringProduct.currency,
      is_active: ringProduct.is_active,
      image_asset_path: ringProduct.image?.asset_path || "",
      image_alt_uk: ringProduct.image?.alt_uk || ringProduct.name_uk,
      image_alt_en: ringProduct.image?.alt_en || ringProduct.name_en,
      metal: "Gold",
      stoneType: "Moonstone",
      stoneShape: "Emerald Cut",
      stoneColor: "Ice",
      stoneSize: "1.1 ct",
      ringSize: "18",
      ringType: "Signature",
      braceletLength: "19 cm"
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(ringProduct.id);
    expect(response.body.data.filters.type).toBe("Ring");
    expect(response.body.data.filters.stoneType).toBe("Moonstone");
    expect(response.body.data.filters.stoneShape).toBe("Emerald Cut");
    expect(response.body.data.filters.stoneColor).toBe("Ice");
    expect(response.body.data.filters.stoneSize).toBe("1.1 ct");
    expect(response.body.data.filters.ringSize).toBe("18");
    expect(response.body.data.filters.ringType).toBe("Signature");
    expect(response.body.data.filters.braceletLength).toBeNull();
  });
});
