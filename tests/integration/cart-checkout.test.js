import { createRequire } from "module";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";

const require = createRequire(import.meta.url);
const { db } = require("../../server/db/knex");
const { createApp } = require("../../server/app");
const { ORDER_STATUSES } = require("../../server/constants/order-statuses");
const { updateAdminOrderStatus } = require("../../server/modules/admin-orders/admin-orders.service");
const { listAdminOrders } = require("../../server/modules/admin-orders/admin-orders.service");
const { addCartItem, applyCartPromoCode, getOrCreateActiveCart, serializeCart } = require("../../server/modules/cart/cart.service");
const { createCheckoutOrder } = require("../../server/modules/checkout/checkout.service");
const { confirmMockPayment } = require("../../server/modules/payments/payments.service");

const MIGRATIONS_DIRECTORY = "./db/migrations";
const SEEDS_DIRECTORY = "./db/seeds";
const CHECKOUT_PAYLOAD = {
  customer_name: "Test Customer",
  email: "client@aurora.local",
  phone: "+380000000002",
  delivery_method: "nova_poshta",
  delivery_address: "Kyiv, branch 1",
  accepted_offer: true,
  accepted_return_policy: true
};
const CLIENT_USER = {
  id: 2,
  role: "client"
};

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

describe("cart and checkout integrity", () => {
  beforeAll(async () => {
    await resetDatabase();
    await db.migrate.latest({ directory: MIGRATIONS_DIRECTORY });
  });

  beforeEach(async () => {
    await db.seed.run({ directory: SEEDS_DIRECTORY });
  });

  test("reuses the same active cart for the user", async () => {
    const firstCart = await getOrCreateActiveCart(2);
    const secondCart = await getOrCreateActiveCart(2);

    expect(secondCart.id).toBe(firstCart.id);

    const activeCarts = await db("carts").where({ user_id: 2, status: "active" });
    expect(activeCarts).toHaveLength(1);
    expect(activeCarts[0].active_cart_key).toBe("active:2");
  });

  test("creates only one order when checkout is requested twice", async () => {
    const results = await Promise.allSettled([
      createCheckoutOrder(2, CHECKOUT_PAYLOAD),
      createCheckoutOrder(2, CHECKOUT_PAYLOAD)
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.code).toBe("EMPTY_CART");

    const userOrders = await db("orders").where({ user_id: 2 });
    const activeCarts = await db("carts").where({ user_id: 2, status: "active" });
    const checkedOutCarts = await db("carts").where({ user_id: 2, status: "checked_out" });

    expect(userOrders).toHaveLength(3);
    expect(activeCarts).toHaveLength(1);
    expect(checkedOutCarts).toHaveLength(1);
    expect(activeCarts[0].active_cart_key).toBe("active:2");
    expect(checkedOutCarts[0].active_cart_key).toBeNull();
  });

  test("checkout rejects invalid public contact payload", async () => {
    await expect(
      createCheckoutOrder(2, {
        ...CHECKOUT_PAYLOAD,
        customer_name: "   ",
        phone: "12345",
        delivery_address: "abc"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: expect.objectContaining({
        customer_name: expect.any(String),
        phone: expect.any(String),
        delivery_address: expect.any(String)
      })
    });
  });

  test("cart rejects fractional quantity", async () => {
    await expect(
      addCartItem(2, {
        item_type: "ready_product",
        product_id: 1,
        quantity: 1.5,
        configuration: { size: "17" }
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  test("payment confirmation is idempotent", async () => {
    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);

    const results = await Promise.allSettled([
      confirmMockPayment(CLIENT_USER, {
        order_id: checkoutResult.order_id,
        payment_token: checkoutResult.payment_token
      }),
      confirmMockPayment(CLIENT_USER, {
        order_id: checkoutResult.order_id,
        payment_token: checkoutResult.payment_token
      })
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");

    expect(fulfilled).toHaveLength(2);
    expect(fulfilled[0].value.payment_status).toBe("succeeded");
    expect(fulfilled[1].value.payment_status).toBe("succeeded");

    const order = await db("orders").where({ id: checkoutResult.order_id }).first();
    const payment = await db("payments").where({ order_id: checkoutResult.order_id }).first();
    const history = await db("order_status_history").where({ order_id: checkoutResult.order_id });
    const notifications = await db("notification_logs").where({ order_id: checkoutResult.order_id });

    expect(order.status).toBe(ORDER_STATUSES.CONFIRMED);
    expect(payment.status).toBe("succeeded");
    expect(history).toHaveLength(2);
    expect(notifications).toHaveLength(2);
  });

  test("admin cannot skip directly to completed", async () => {
    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);
    await confirmMockPayment(CLIENT_USER, {
      order_id: checkoutResult.order_id,
      payment_token: checkoutResult.payment_token
    });

    await expect(updateAdminOrderStatus(1, checkoutResult.order_id, ORDER_STATUSES.COMPLETED)).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });

    const order = await db("orders").where({ id: checkoutResult.order_id }).first();
    expect(order.status).toBe(ORDER_STATUSES.CONFIRMED);
  });

  test("admin rollback requires a comment and cannot skip backward", async () => {
    await expect(updateAdminOrderStatus(1, 2, ORDER_STATUSES.CONFIRMED)).rejects.toMatchObject({
      code: "COMMENT_REQUIRED"
    });

    await expect(updateAdminOrderStatus(1, 2, ORDER_STATUSES.CREATED_PENDING_PAYMENT, "Too far back")).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });

    const updatedOrder = await updateAdminOrderStatus(1, 2, ORDER_STATUSES.CONFIRMED, "Returning to confirmation");
    expect(updatedOrder.status).toBe(ORDER_STATUSES.CONFIRMED);
  });

  test("promo redemption is recorded once and updates counters", async () => {
    await applyCartPromoCode(2, "WELCOME10");

    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);
    const order = await db("orders").where({ id: checkoutResult.order_id }).first();
    const promoCode = await db("promo_codes").where({ code: "WELCOME10" }).first();
    const redemptions = await db("promo_code_redemptions").where({ order_id: checkoutResult.order_id });
    const userUsage = await db("promo_code_user_usage").where({ promo_code_id: promoCode.id, user_id: 2 }).first();

    expect(order.promo_code_snapshot).toBe("WELCOME10");
    expect(Number(order.discount_amount)).toBeGreaterThan(0);
    expect(promoCode.redemption_count).toBe(1);
    expect(redemptions).toHaveLength(1);
    expect(userUsage.redemption_count).toBe(1);
  });

  test("per-user promo limit is enforced after first redemption", async () => {
    await applyCartPromoCode(2, "WELCOME10");
    await createCheckoutOrder(2, CHECKOUT_PAYLOAD);

    const newCart = await getOrCreateActiveCart(2);
    await db("cart_items").insert({
      cart_id: newCart.id,
      item_type: "ready_product",
      product_id: 2,
      title_snapshot: "Test product",
      unit_price: 999,
      quantity: 1
    });

    const error = await applyCartPromoCode(2, "WELCOME10").catch((caughtError) => caughtError);
    expect(error.code).toBe("PROMO_CODE_USER_LIMIT");
  });

  test("database rejects inconsistent cart item shape", async () => {
    const cart = await getOrCreateActiveCart(2);

    await expect(
      db("cart_items").insert({
        cart_id: cart.id,
        item_type: "ready_product",
        product_id: null,
        jewelry_type_id: 1,
        configuration_json: JSON.stringify({ invalid: true }),
        title_snapshot: "Broken item",
        unit_price: 100,
        quantity: 1
      })
    ).rejects.toThrow();
  });

  test("ready products keep selected size through cart and checkout", async () => {
    const cart = await getOrCreateActiveCart(2);
    await db("cart_items").where({ cart_id: cart.id }).del();

    await addCartItem(2, {
      item_type: "ready_product",
      product_id: 1,
      quantity: 1,
      configuration: { size: "17" }
    });

    await addCartItem(2, {
      item_type: "ready_product",
      product_id: 1,
      quantity: 1,
      configuration: { size: "18" }
    });

    const serializedCart = await serializeCart(cart.id, { userId: 2 });
    const sizedItems = serializedCart.items
      .filter((item) => item.product_id === 1)
      .map((item) => item.configuration?.size)
      .sort();

    expect(sizedItems).toEqual(["17", "18"]);

    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);
    const orderItems = await db("order_items").where({ order_id: checkoutResult.order_id, product_id: 1 }).orderBy("id", "asc");
    const orderSizes = orderItems.map((item) => JSON.parse(item.configuration_json || "{}").size).sort();

    expect(orderSizes).toEqual(["17", "18"]);
  });

  test("ready pendant keeps chain configuration and backend surcharge through checkout", async () => {
    const cart = await getOrCreateActiveCart(2);
    await db("cart_items").where({ cart_id: cart.id }).del();

    const pendantProduct = await db("products").where({ slug: "silver-heart-pendant" }).first();

    await addCartItem(2, {
      item_type: "ready_product",
      product_id: pendantProduct.id,
      quantity: 1,
      configuration: { chainOption: "45cm", chain: { option: "50cm", price: 999999 } }
    });

    const serializedCart = await serializeCart(cart.id, { userId: 2 });
    const pendantItem = serializedCart.items.find((item) => item.product_id === pendantProduct.id);

    expect(pendantItem.configuration?.chain).toEqual({
      option: "45cm",
      length: 45,
      metal: "Silver",
      price: 1450
    });
    expect(pendantItem.unit_price).toBe(Number(pendantProduct.price) + 1450);

    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);
    const orderItem = await db("order_items")
      .where({ order_id: checkoutResult.order_id, product_id: pendantProduct.id })
      .first();
    const savedConfiguration = JSON.parse(orderItem.configuration_json || "{}");

    expect(savedConfiguration.chain).toEqual({
      option: "45cm",
      length: 45,
      metal: "Silver",
      price: 1450
    });
    expect(Number(orderItem.unit_price)).toBe(Number(pendantProduct.price) + 1450);
  });

  test("custom pendant keeps chain configuration and backend surcharge through checkout", async () => {
    const cart = await getOrCreateActiveCart(2);
    await db("cart_items").where({ cart_id: cart.id }).del();

    const pendantType = await db("jewelry_types").where({ code: "pendant" }).first();

    await addCartItem(2, {
      item_type: "custom_design",
      jewelry_type_id: pendantType.id,
      quantity: 1,
      configuration: {
        variant_id: 301,
        material: "gold",
        chainOption: "50cm",
        stone_slots: {
          pendant: "pearl"
        }
      }
    });

    const serializedCart = await serializeCart(cart.id, { userId: 2 });
    const customPendant = serializedCart.items.find((item) => item.item_type === "custom_design" && item.jewelry_type_id === pendantType.id);

    expect(customPendant.configuration?.chain).toEqual({
      option: "50cm",
      length: 50,
      metal: "Gold",
      price: 4400
    });
    expect(customPendant.unit_price).toBeGreaterThanOrEqual(4400);

    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);
    const orderItem = await db("order_items")
      .where({ order_id: checkoutResult.order_id, jewelry_type_id: pendantType.id, item_type: "custom_design" })
      .first();
    const savedConfiguration = JSON.parse(orderItem.configuration_json || "{}");

    expect(savedConfiguration.chain).toEqual({
      option: "50cm",
      length: 50,
      metal: "Gold",
      price: 4400
    });
    expect(Number(orderItem.unit_price)).toBe(Number(customPendant.unit_price));
  });

  test("checkout uses account email when payload email is omitted", async () => {
    const result = await createCheckoutOrder(2, {
      ...CHECKOUT_PAYLOAD,
      email: ""
    });

    const order = await db("orders").where({ id: result.order_id }).first();
    expect(order.email).toBe("client@aurora.local");
  });

  test("database rejects inconsistent order totals", async () => {
    await expect(
      db("orders").insert({
        order_number: "ORD-TEST-CONSTRAINT",
        user_id: 2,
        status: ORDER_STATUSES.CREATED_PENDING_PAYMENT,
        customer_name: "Constraint Test",
        email: "client@aurora.local",
        phone: "+380000000002",
        delivery_method: "nova_poshta",
        delivery_address: "Kyiv, branch 1",
        subtotal_amount: 1000,
        discount_amount: 50,
        total_amount: 990,
        currency: "UAH"
      })
    ).rejects.toThrow();
  });

  test("admin dashboard returns filtered orders with summary", async () => {
    await createCheckoutOrder(2, CHECKOUT_PAYLOAD);

    const dashboard = await listAdminOrders({
      status: ORDER_STATUSES.CREATED_PENDING_PAYMENT,
      payment_state: "unpaid",
      search: "TEST CUSTOMER"
    });

    expect(dashboard.orders).toHaveLength(1);
    expect(dashboard.orders[0].status).toBe(ORDER_STATUSES.CREATED_PENDING_PAYMENT);
    expect(dashboard.orders[0].payment_state).toBe("unpaid");
    expect(dashboard.summary.total_orders).toBe(1);
    expect(dashboard.summary.awaiting_payment).toBe(1);
    expect(dashboard.summary.unpaid_orders).toBe(1);
  });

  test("catalog filters return matching demo products", async () => {
    const app = createApp();

    const ringResponse = await request(app).get("/api/catalog/products").query({
      type: "Ring",
      ringSize: "17",
      ringStyle: "Fashion",
      stone: ["Pearl", "Diamond"],
      sort: "price_desc"
    });
    const braceletResponse = await request(app).get("/api/catalog/products").query({
      type: "Bracelet",
      braceletLength: "18 cm"
    });
    const pendantResponse = await request(app).get("/api/catalog/products").query({
      type: "Pendant",
      priceMin: 10000,
      priceMax: 17000,
      sort: "newest"
    });
    const detailResponse = await request(app).get("/api/catalog/products/quiet-pearl-ring");

    expect(ringResponse.status).toBe(200);
    expect(ringResponse.body.data.map((product) => product.slug)).toContain("quiet-pearl-ring");
    expect(ringResponse.body.data[0].price).toBeGreaterThanOrEqual(ringResponse.body.data.at(-1).price);
    expect(braceletResponse.status).toBe(200);
    expect(braceletResponse.body.data.map((product) => product.slug)).toContain("moon-bracelet");
    expect(pendantResponse.status).toBe(200);
    expect(pendantResponse.body.data.map((product) => product.slug)).toContain("sun-disc-pendant");
    expect(pendantResponse.body.data.every((product) => product.filters.type === "Pendant")).toBe(true);
    expect(pendantResponse.body.data.every((product) => product.price >= 10000 && product.price <= 17000)).toBe(true);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.filters).toMatchObject({
      type: "Ring",
      metal: "Rose Gold",
      stoneType: "Pearl",
      stone: "Pearl",
      ringSize: "17",
      ringType: "Fashion",
      ringStyle: "Fashion"
    });
  });

  test("catalog supports paginated product loading and lightweight facets", async () => {
    const app = createApp();

    const firstPage = await request(app).get("/api/catalog/products").query({
      page: 1,
      limit: 5,
      type: "Ring",
      sort: "price_asc"
    });
    const secondPage = await request(app).get("/api/catalog/products").query({
      page: 2,
      limit: 5,
      type: "Ring",
      sort: "price_asc"
    });
    const facetsResponse = await request(app).get("/api/catalog/products/facets").query({ type: "Ring" });

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(5);
    expect(firstPage.body.data.pageInfo).toMatchObject({
      page: 1,
      limit: 5,
      hasNextPage: true,
      hasPreviousPage: false
    });
    expect(firstPage.body.data.items.every((product) => product.filters.type === "Ring")).toBe(true);
    expect(firstPage.body.data.items[0].price).toBeLessThanOrEqual(firstPage.body.data.items.at(-1).price);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.items.map((product) => product.id)).not.toEqual(firstPage.body.data.items.map((product) => product.id));
    expect(facetsResponse.status).toBe(200);
    expect(facetsResponse.body.data.facets.type).toEqual(["Ring"]);
    expect(facetsResponse.body.data.facets.metal).toContain("Rose Gold");
    expect(facetsResponse.body.data.priceBounds.max).toBeGreaterThanOrEqual(facetsResponse.body.data.priceBounds.min);
  });

  test("constructor price counts every selected stone slot server-side", async () => {
    const app = createApp();

    const response = await request(app).post("/api/constructor/price").send({
      jewelry_type_id: 1,
      configuration: {
        variant_id: 101,
        material: "silver",
        size: "16",
        stone_slots: {
          center: "pearl",
          left: "onyx",
          right: "garnet"
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.data.price).toBe(11750);
  });

  test("constructor price supports new duet variant and normalizes variant id", async () => {
    const app = createApp();

    const response = await request(app).post("/api/constructor/price").send({
      jewelry_type_id: 1,
      configuration: {
        variant_id: 103,
        material: "rose_gold",
        size: "19",
        stone_slots: {
          left: "diamond",
          right: "pearl"
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.data.is_valid).toBe(true);
    expect(response.body.data.price).toBe(21400);
    expect(response.body.data.normalized_configuration.variant_id).toBe(103);
  });

  test("constructor price rejects invalid stone slot ids", async () => {
    const app = createApp();

    const response = await request(app).post("/api/constructor/price").send({
      jewelry_type_id: 1,
      configuration: {
        variant_id: 101,
        material: "silver",
        size: "16",
        stone_slots: {
          center: "pearl",
          shoulder: "onyx"
        }
      }
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("INVALID_CONFIGURATION_VALUE");
    expect(response.body.error.details.invalid_slots).toEqual(["shoulder"]);
  });

  test("constructor price rejects stones outside new variant matrix", async () => {
    const app = createApp();

    const response = await request(app).post("/api/constructor/price").send({
      jewelry_type_id: 2,
      configuration: {
        variant_id: 203,
        material: "silver",
        size: "16",
        stone_slots: {
          left: "heart_charm",
          right: "pearl"
        }
      }
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("INVALID_CONFIGURATION_VALUE");
    expect(response.body.error.details).toMatchObject({
      stone: "heart_charm",
      variant_id: 203
    });
  });

  test("account endpoint requires auth", async () => {
    const app = createApp();
    const response = await request(app).get("/api/account");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("account endpoint returns profile, current order and completed history", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const checkoutResult = await createCheckoutOrder(2, CHECKOUT_PAYLOAD);
    await confirmMockPayment(CLIENT_USER, {
      order_id: checkoutResult.order_id,
      payment_token: checkoutResult.payment_token
    });
    await updateAdminOrderStatus(1, checkoutResult.order_id, ORDER_STATUSES.IN_PROGRESS);
    await updateAdminOrderStatus(1, checkoutResult.order_id, ORDER_STATUSES.COMPLETED);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "client@aurora.local",
      password: "password123"
    });

    expect(loginResponse.status).toBe(200);

    const response = await agent.get("/api/account");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("client@aurora.local");
    expect(response.body.data.user.phone).toBeTruthy();
    expect(response.body.data.current_order).toBeTruthy();
    expect(response.body.data.current_order.status).not.toBe(ORDER_STATUSES.COMPLETED);
    expect(response.body.data.current_order.items.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.data.completed_orders)).toBe(true);
    expect(response.body.data.completed_orders.length).toBeGreaterThan(0);
    expect(response.body.data.completed_orders[0].status).toBe(ORDER_STATUSES.COMPLETED);
    expect(response.body.data.completed_orders[0].items.length).toBeGreaterThan(0);
  });
});
