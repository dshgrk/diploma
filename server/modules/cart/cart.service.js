const { db } = require("../../db/knex");
const { CART_ITEM_TYPES } = require("../../constants/cart-item-types");
const { createHttpError } = require("../../utils/http-error");
const { roundCurrency, sumMoney } = require("../../utils/money");
const { calculateDesignPrice } = require("../pricing/pricing.service");
const { parseJsonField } = require("../../utils/json");
const { attachPromoCodeToCart, detachPromoCodeFromCart, resolveAppliedPromo } = require("../promotions/promo-codes.service");

function buildActiveCartKey(userId) {
  return `active:${userId}`;
}

function isUniqueConstraintError(error) {
  return (
    error?.code === "SQLITE_CONSTRAINT" ||
    error?.code === "ER_DUP_ENTRY" ||
    error?.errno === 1062 ||
    /unique/i.test(String(error?.message || ""))
  );
}

async function getOrCreateActiveCart(userId, options = {}) {
  const trx = options.trx || db;
  let cart = await trx("carts").where({ user_id: userId, status: "active" }).orderBy("id", "desc").first();

  if (!cart) {
    try {
      const [cartId] = await trx("carts").insert({
        user_id: userId,
        status: "active",
        currency: options.currency || "UAH",
        active_cart_key: buildActiveCartKey(userId)
      });
      cart = await trx("carts").where({ id: cartId }).first();
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      cart = await trx("carts").where({ user_id: userId, status: "active" }).orderBy("id", "desc").first();
    }
  }

  return cart;
}

async function serializeCart(cartId, options = {}) {
  const trx = options.trx || db;
  const cart = await trx("carts").where({ id: cartId }).first();
  if (!cart) {
    throw createHttpError(404, "CART_NOT_FOUND", "Cart not found");
  }

  const items = await trx("cart_items")
    .leftJoin("products", "cart_items.product_id", "products.id")
    .leftJoin("jewelry_types", "cart_items.jewelry_type_id", "jewelry_types.id")
    .select(
      "cart_items.id",
      "cart_items.item_type",
      "cart_items.product_id",
      "cart_items.jewelry_type_id",
      "cart_items.configuration_json",
      "cart_items.title_snapshot",
      "cart_items.unit_price",
      "cart_items.quantity",
      "products.slug as product_slug",
      "products.is_active as product_is_active",
      "jewelry_types.code as jewelry_type_code"
    )
    .where("cart_items.cart_id", cartId)
    .orderBy("cart_items.created_at", "asc");

  const serializedItems = items.map((item) => ({
    id: item.id,
    item_type: item.item_type,
    product_id: item.product_id,
    jewelry_type_id: item.jewelry_type_id,
    product_slug: item.product_slug,
    jewelry_type_code: item.jewelry_type_code,
    title: item.title_snapshot,
    configuration: parseJsonField(item.configuration_json, {}),
    unit_price: Number(item.unit_price),
    quantity: item.quantity,
    line_total: Number(item.unit_price) * item.quantity
  }));

  const subtotalAmount = sumMoney(serializedItems.map((item) => item.line_total));
  const promoPricing = await resolveAppliedPromo({
    promoCodeId: cart.promo_code_id,
    userId: options.userId || cart.user_id,
    subtotalAmount,
    trx,
    throwOnInvalid: options.throwOnInvalidPromo === true
  });

  return {
    items: serializedItems,
    subtotal_amount: subtotalAmount,
    discount_amount: promoPricing.discount_amount,
    total_amount: roundCurrency(subtotalAmount - promoPricing.discount_amount),
    currency: cart.currency || "UAH",
    applied_promo: promoPricing.applied_promo
  };
}

async function getCartForUser(userId) {
  const cart = await getOrCreateActiveCart(userId);
  const serialized = await serializeCart(cart.id, { userId });
  return {
    id: cart.id,
    status: cart.status,
    ...serialized
  };
}

async function addCartItem(userId, payload, req) {
  const cart = await getOrCreateActiveCart(userId);

  if (payload.item_type === CART_ITEM_TYPES.READY_PRODUCT) {
    if (!payload.product_id) {
      throw createHttpError(422, "VALIDATION_ERROR", "product_id is required for ready_product");
    }

    const product = await db("products").where({ id: payload.product_id, is_active: true }).first();
    if (!product) {
      throw createHttpError(404, "PRODUCT_NOT_FOUND", "Active product not found");
    }

    const quantity = Number(payload.quantity || 1);
    if (quantity < 1) {
      throw createHttpError(422, "VALIDATION_ERROR", "Quantity must be at least 1");
    }

    const existing = await db("cart_items")
      .where({
        cart_id: cart.id,
        item_type: CART_ITEM_TYPES.READY_PRODUCT,
        product_id: product.id
      })
      .first();

    if (existing) {
      await db("cart_items")
        .where({ id: existing.id })
        .update({
          quantity: existing.quantity + quantity,
          updated_at: db.fn.now()
        });
    } else {
      await db("cart_items").insert({
        cart_id: cart.id,
        item_type: CART_ITEM_TYPES.READY_PRODUCT,
        product_id: product.id,
        title_snapshot: product.name_uk,
        unit_price: product.price,
        quantity
      });
    }
  } else if (payload.item_type === CART_ITEM_TYPES.CUSTOM_DESIGN) {
    if (!payload.jewelry_type_id) {
      throw createHttpError(422, "VALIDATION_ERROR", "jewelry_type_id is required for custom_design");
    }

    const calculation = await calculateDesignPrice({
      jewelryTypeId: Number(payload.jewelry_type_id),
      configuration: payload.configuration || {},
      req
    });

    if (!calculation.is_valid) {
      throw createHttpError(422, "INCOMPLETE_CONFIGURATION", "Design configuration is incomplete", {
        missing_required: calculation.missing_required
      });
    }

    await db("cart_items").insert({
      cart_id: cart.id,
      item_type: CART_ITEM_TYPES.CUSTOM_DESIGN,
      jewelry_type_id: Number(payload.jewelry_type_id),
      configuration_json: JSON.stringify(payload.configuration || {}),
      title_snapshot: calculation.jewelry_type,
      unit_price: calculation.price,
      quantity: 1
    });
  } else {
    throw createHttpError(422, "VALIDATION_ERROR", "Unsupported cart item type");
  }

  return getCartForUser(userId);
}

async function updateCartItem(userId, itemId, payload, req) {
  const cart = await getOrCreateActiveCart(userId);
  const item = await db("cart_items").where({ id: itemId, cart_id: cart.id }).first();

  if (!item) {
    throw createHttpError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  if (item.item_type === CART_ITEM_TYPES.READY_PRODUCT) {
    const quantity = Number(payload.quantity || item.quantity);
    if (quantity < 1) {
      throw createHttpError(422, "VALIDATION_ERROR", "Quantity must be at least 1");
    }

    await db("cart_items").where({ id: item.id }).update({
      quantity,
      updated_at: db.fn.now()
    });
  } else {
    const calculation = await calculateDesignPrice({
      jewelryTypeId: item.jewelry_type_id,
      configuration: payload.configuration || {},
      req
    });

    if (!calculation.is_valid) {
      throw createHttpError(422, "INCOMPLETE_CONFIGURATION", "Design configuration is incomplete", {
        missing_required: calculation.missing_required
      });
    }

    await db("cart_items").where({ id: item.id }).update({
      configuration_json: JSON.stringify(payload.configuration || {}),
      title_snapshot: calculation.jewelry_type,
      unit_price: calculation.price,
      updated_at: db.fn.now()
    });
  }

  return getCartForUser(userId);
}

async function deleteCartItem(userId, itemId) {
  const cart = await getOrCreateActiveCart(userId);
  await db("cart_items").where({ id: itemId, cart_id: cart.id }).del();
  return getCartForUser(userId);
}

async function applyCartPromoCode(userId, code) {
  const cart = await getOrCreateActiveCart(userId);
  await attachPromoCodeToCart({
    cartId: cart.id,
    userId,
    code
  });

  return getCartForUser(userId);
}

async function removeCartPromoCode(userId) {
  const cart = await getOrCreateActiveCart(userId);
  await detachPromoCodeFromCart({ cartId: cart.id });
  return getCartForUser(userId);
}

module.exports = {
  addCartItem,
  applyCartPromoCode,
  buildActiveCartKey,
  deleteCartItem,
  getCartForUser,
  getOrCreateActiveCart,
  removeCartPromoCode,
  serializeCart,
  updateCartItem
};
