// Файл містить бізнес-логіку серверного модуля cart та готує дані для API.
const { db } = require("../../db/knex");
const { CART_ITEM_TYPES } = require("../../constants/cart-item-types");
const { createHttpError } = require("../../utils/http-error");
const { roundCurrency, sumMoney } = require("../../utils/money");
const { calculateDesignPrice } = require("../pricing/pricing.service");
const { parseJsonField } = require("../../utils/json");
const { attachPromoCodeToCart, detachPromoCodeFromCart, resolveAppliedPromo } = require("../promotions/promo-codes.service");
const { resolveProductImage } = require("../../utils/product-image");
const { normalizeReadyProductConfiguration, readyProductConfigurationsEqual } = require("../../utils/ready-product-size");
const { calculateReadyProductUnitPrice, resolveReadyProductChainConfiguration } = require("../../utils/pendant-chain");
const { pickLocalizedFields, resolveLocale } = require("../../utils/locale");

const MAX_CART_ITEM_QUANTITY = 100;

// Формує структуру build active cart key для UI, API-відповіді або подальших розрахунків.
function buildActiveCartKey(userId) {
  return `active:${userId}`;
}

// Перевіряє is unique constraint error і повертає результат або кидає помилку валідації.
function isUniqueConstraintError(error) {
  return (
    error?.code === "SQLITE_CONSTRAINT" ||
    error?.code === "ER_DUP_ENTRY" ||
    error?.errno === 1062 ||
    /unique/i.test(String(error?.message || ""))
  );
}

// Перевіряє validate cart quantity і повертає результат або кидає помилку валідації.
function validateCartQuantity(quantity) {
  if (!Number.isInteger(quantity)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Quantity must be a whole number");
  }

  if (quantity < 1) {
    throw createHttpError(422, "VALIDATION_ERROR", "Quantity must be at least 1");
  }

  if (quantity > MAX_CART_ITEM_QUANTITY) {
    throw createHttpError(422, "VALIDATION_ERROR", `Quantity must be at most ${MAX_CART_ITEM_QUANTITY}`);
  }
}

// Формує структуру build ready product configuration для UI, API-відповіді або подальших розрахунків.
function buildReadyProductConfiguration(product, configuration = {}) {
  const normalizedSize = normalizeReadyProductConfiguration(product, configuration || {});
  const normalizedChain = resolveReadyProductChainConfiguration(product, configuration || {});
  return normalizedChain ? { ...normalizedSize, chain: normalizedChain } : normalizedSize;
}

// Отримує get or create active cart з поточного набору даних або конфігурації.
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

// Виконує локальну логіку serialize cart для модуля серверного модуля cart.
async function serializeCart(cartId, options = {}) {
  const trx = options.trx || db;
  const locale = options.locale || "uk";
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
      "products.filter_type as product_type",
      "products.is_active as product_is_active",
      "products.name_uk as product_name_uk",
      "products.name_en as product_name_en",
      "jewelry_types.code as jewelry_type_code"
    )
    .where("cart_items.cart_id", cartId)
    .orderBy("cart_items.created_at", "asc");

  const productIds = items.map((item) => item.product_id).filter(Boolean);
  const productImages = productIds.length
    ? await trx("product_images").whereIn("product_id", productIds).andWhere({ is_primary: true })
    : [];
  const imageByProductId = productImages.reduce((accumulator, image) => {
    accumulator[image.product_id] = image;
    return accumulator;
  }, {});

  const serializedItems = items.map((item) => {
    const localizedProduct = item.product_id
      ? pickLocalizedFields(
          {
            name_uk: item.product_name_uk,
            name_en: item.product_name_en
          },
          locale,
          ["name"]
        )
      : null;

    return {
      id: item.id,
      item_type: item.item_type,
      product_id: item.product_id,
      jewelry_type_id: item.jewelry_type_id,
      product_slug: item.product_slug,
      product_type: item.product_type || null,
      jewelry_type_code: item.jewelry_type_code,
      thumbnail_url: item.product_id
        ? resolveProductImage(imageByProductId[item.product_id]?.asset_path, item.product_type || item.jewelry_type_code, item.product_slug)
        : null,
      title: item.item_type === CART_ITEM_TYPES.READY_PRODUCT ? localizedProduct?.name || item.title_snapshot : item.title_snapshot,
      configuration: parseJsonField(item.configuration_json, {}),
      unit_price: Number(item.unit_price),
      quantity: item.quantity,
      line_total: Number(item.unit_price) * item.quantity
    };
  });

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

// Отримує get cart for user з поточного набору даних або конфігурації.
async function getCartForUser(userId, options = {}) {
  const cart = await getOrCreateActiveCart(userId);
  const serialized = await serializeCart(cart.id, { userId, locale: options.locale || "uk" });
  return {
    id: cart.id,
    status: cart.status,
    ...serialized
  };
}

// Виконує локальну логіку add cart item для модуля серверного модуля cart.
async function addCartItem(userId, payload, req) {
  const cart = await getOrCreateActiveCart(userId);
  const locale = resolveLocale(req);

  if (payload.item_type === CART_ITEM_TYPES.READY_PRODUCT) {
    if (!payload.product_id) {
      throw createHttpError(422, "VALIDATION_ERROR", "product_id is required for ready_product");
    }

    const product = await db("products").where({ id: payload.product_id, is_active: true }).first();
    if (!product) {
      throw createHttpError(404, "PRODUCT_NOT_FOUND", "Active product not found");
    }

    const normalizedConfiguration = buildReadyProductConfiguration(product, payload.configuration || {});
    const configurationJson = Object.keys(normalizedConfiguration).length ? JSON.stringify(normalizedConfiguration) : null;
    const unitPrice = calculateReadyProductUnitPrice(product, normalizedConfiguration);

    const quantity = Number(payload.quantity || 1);
    validateCartQuantity(quantity);

    const existingItems = await db("cart_items")
      .where({
        cart_id: cart.id,
        item_type: CART_ITEM_TYPES.READY_PRODUCT,
        product_id: product.id
      });

    const existing = existingItems.find((entry) =>
      readyProductConfigurationsEqual(parseJsonField(entry.configuration_json, {}), normalizedConfiguration)
    );

    if (existing) {
      validateCartQuantity(Number(existing.quantity || 0) + quantity);
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
        configuration_json: configurationJson,
        title_snapshot: pickLocalizedFields(product, locale, ["name"]).name,
        unit_price: unitPrice,
        quantity
      });
    }
  } else if (payload.item_type === CART_ITEM_TYPES.CUSTOM_DESIGN) {
    if (!payload.jewelry_type_id) {
      throw createHttpError(422, "VALIDATION_ERROR", "jewelry_type_id is required for custom_design");
    }

    const quantity = Number(payload.quantity || 1);
    validateCartQuantity(quantity);

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
      configuration_json: JSON.stringify(calculation.normalized_configuration || payload.configuration || {}),
      title_snapshot: calculation.jewelry_type,
      unit_price: calculation.price,
      quantity
    });
  } else {
    throw createHttpError(422, "VALIDATION_ERROR", "Unsupported cart item type");
  }

  return getCartForUser(userId, { locale });
}

// Оновлює існуючі дані update cart item без зміни решти стану.
async function updateCartItem(userId, itemId, payload, req) {
  const cart = await getOrCreateActiveCart(userId);
  const locale = resolveLocale(req);
  const item = await db("cart_items").where({ id: itemId, cart_id: cart.id }).first();

  if (!item) {
    throw createHttpError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  if (item.item_type === CART_ITEM_TYPES.READY_PRODUCT) {
    const product = await db("products").where({ id: item.product_id, is_active: true }).first();
    if (!product) {
      throw createHttpError(404, "PRODUCT_NOT_FOUND", "Active product not found");
    }

    const quantity = Number(payload.quantity || item.quantity);
    validateCartQuantity(quantity);

    const currentConfiguration = parseJsonField(item.configuration_json, {});
    const normalizedConfiguration =
      payload.configuration || currentConfiguration
        ? buildReadyProductConfiguration(product, payload.configuration || currentConfiguration)
        : {};
    const configurationJson = Object.keys(normalizedConfiguration).length ? JSON.stringify(normalizedConfiguration) : null;
    const unitPrice = calculateReadyProductUnitPrice(product, normalizedConfiguration);

    await db("cart_items").where({ id: item.id }).update({
      configuration_json: configurationJson,
      unit_price: unitPrice,
      quantity,
      updated_at: db.fn.now()
    });
  } else {
    const quantity = Number(payload.quantity || item.quantity || 1);
    validateCartQuantity(quantity);

    const currentConfiguration = parseJsonField(item.configuration_json, {});
    const nextConfiguration = payload.configuration || currentConfiguration;
    const calculation = await calculateDesignPrice({
      jewelryTypeId: item.jewelry_type_id,
      configuration: nextConfiguration,
      req
    });

    if (!calculation.is_valid) {
      throw createHttpError(422, "INCOMPLETE_CONFIGURATION", "Design configuration is incomplete", {
        missing_required: calculation.missing_required
      });
    }

    await db("cart_items").where({ id: item.id }).update({
      configuration_json: JSON.stringify(calculation.normalized_configuration || nextConfiguration),
      title_snapshot: calculation.jewelry_type,
      unit_price: calculation.price,
      quantity,
      updated_at: db.fn.now()
    });
  }

  return getCartForUser(userId, { locale });
}

// Видаляє або деактивує запис delete cart item згідно з правилами модуля.
async function deleteCartItem(userId, itemId, options = {}) {
  const cart = await getOrCreateActiveCart(userId);
  await db("cart_items").where({ id: itemId, cart_id: cart.id }).del();
  return getCartForUser(userId, options);
}

// Виконує локальну логіку apply cart promo code для модуля серверного модуля cart.
async function applyCartPromoCode(userId, code, options = {}) {
  const cart = await getOrCreateActiveCart(userId);
  await attachPromoCodeToCart({
    cartId: cart.id,
    userId,
    code
  });

  return getCartForUser(userId, options);
}

// Видаляє або деактивує запис remove cart promo code згідно з правилами модуля.
async function removeCartPromoCode(userId, options = {}) {
  const cart = await getOrCreateActiveCart(userId);
  await detachPromoCodeFromCart({ cartId: cart.id });
  return getCartForUser(userId, options);
}

module.exports = {
  addCartItem,
  applyCartPromoCode,
  buildActiveCartKey,
  deleteCartItem,
  getCartForUser,
  getOrCreateActiveCart,
  MAX_CART_ITEM_QUANTITY,
  removeCartPromoCode,
  serializeCart,
  updateCartItem
};
