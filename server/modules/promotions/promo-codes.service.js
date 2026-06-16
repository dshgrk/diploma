// Файл містить бізнес-логіку серверного модуля promotions та готує дані для API.
const { db } = require("../../db/knex");
const { createHttpError } = require("../../utils/http-error");
const { roundCurrency } = require("../../utils/money");

const PROMO_DESCRIPTION_BY_CODE = {
  WELCOME10: {
    uk: "Вітальна знижка на перше замовлення в ательє",
    en: "Welcome discount for the first atelier order"
  },
  AURORA200: {
    uk: "Фіксована знижка для більших замовлень",
    en: "Fixed discount for larger orders"
  }
};

// Нормалізує normalize promo code, щоб API та UI працювали з однаковим форматом даних.
function normalizePromoCode(code) {
  return String(code || "").trim().toUpperCase();
}

// Визначає потрібне значення resolve promo description за поточним контекстом або вхідними параметрами.
function resolvePromoDescription(row, locale = "uk") {
  if (!row) return null;

  const normalizedLocale = locale === "en" ? "en" : "uk";
  const localized = PROMO_DESCRIPTION_BY_CODE[row.code]?.[normalizedLocale];
  return localized || row.description || null;
}

// Виконує локальну логіку map promo code для модуля серверного модуля promotions.
function mapPromoCode(row, locale = "uk") {
  if (!row) return null;

  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value),
    min_order_amount: Number(row.min_order_amount || 0),
    max_redemptions: row.max_redemptions == null ? null : Number(row.max_redemptions),
    per_user_limit: row.per_user_limit == null ? null : Number(row.per_user_limit),
    redemption_count: Number(row.redemption_count || 0),
    starts_at: row.starts_at,
    expires_at: row.expires_at,
    description: resolvePromoDescription(row, locale),
    is_active: Boolean(row.is_active)
  };
}

// Отримує get promo code by code з поточного набору даних або конфігурації.
async function getPromoCodeByCode(code, trx = db, locale = "uk") {
  const normalizedCode = normalizePromoCode(code);
  if (!normalizedCode) {
    return null;
  }

  const promo = await trx("promo_codes").where({ code: normalizedCode }).first();
  return mapPromoCode(promo, locale);
}

// Отримує get promo code by id з поточного набору даних або конфігурації.
async function getPromoCodeById(promoCodeId, trx = db, locale = "uk") {
  if (!promoCodeId) return null;
  const promo = await trx("promo_codes").where({ id: promoCodeId }).first();
  return mapPromoCode(promo, locale);
}

// Обчислює calculate promo discount та повертає стабільний результат для бізнес-логіки.
function calculatePromoDiscount(promoCode, subtotalAmount) {
  const subtotal = Number(subtotalAmount || 0);
  if (!promoCode || subtotal <= 0) return 0;

  if (promoCode.discount_type === "percent") {
    return roundCurrency(Math.min(subtotal, subtotal * (promoCode.discount_value / 100)));
  }

  return roundCurrency(Math.min(subtotal, promoCode.discount_value));
}

// Перевіряє validate promo code availability і повертає результат або кидає помилку валідації.
function validatePromoCodeAvailability(promoCode) {
  if (!promoCode) {
    throw createHttpError(404, "PROMO_CODE_NOT_FOUND", "Promo code was not found");
  }

  if (!promoCode.is_active) {
    throw createHttpError(422, "PROMO_CODE_INACTIVE", "Promo code is inactive");
  }

  const now = Date.now();
  if (promoCode.starts_at && new Date(promoCode.starts_at).getTime() > now) {
    throw createHttpError(422, "PROMO_CODE_NOT_STARTED", "Promo code is not active yet");
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at).getTime() < now) {
    throw createHttpError(422, "PROMO_CODE_EXPIRED", "Promo code has expired");
  }
}

// Перевіряє validate promo code for cart і повертає результат або кидає помилку валідації.
async function validatePromoCodeForCart({ promoCode, userId, subtotalAmount, trx = db }) {
  validatePromoCodeAvailability(promoCode);

  const subtotal = Number(subtotalAmount || 0);
  if (subtotal < promoCode.min_order_amount) {
    throw createHttpError(
      422,
      "PROMO_CODE_MIN_ORDER",
      `Promo code requires at least ${promoCode.min_order_amount} UAH in the cart`
    );
  }

  if (promoCode.max_redemptions != null) {
    if (promoCode.redemption_count >= promoCode.max_redemptions) {
      throw createHttpError(422, "PROMO_CODE_LIMIT_REACHED", "Promo code redemption limit has been reached");
    }
  }

  if (promoCode.per_user_limit != null) {
    const usage = await trx("promo_code_user_usage")
      .where({
        promo_code_id: promoCode.id,
        user_id: userId
      })
      .first();

    if (Number(usage?.redemption_count || 0) >= promoCode.per_user_limit) {
      throw createHttpError(422, "PROMO_CODE_USER_LIMIT", "Promo code usage limit for this account has been reached");
    }
  }

  return promoCode;
}

// Визначає потрібне значення resolve applied promo за поточним контекстом або вхідними параметрами.
async function resolveAppliedPromo({ promoCodeId, userId, subtotalAmount, trx = db, throwOnInvalid = false, locale = "uk" }) {
  if (!promoCodeId) {
    return {
      applied_promo: null,
      discount_amount: 0
    };
  }

  const promoCode = await getPromoCodeById(promoCodeId, trx, locale);
  if (!promoCode) {
    if (throwOnInvalid) {
      throw createHttpError(404, "PROMO_CODE_NOT_FOUND", "Promo code was not found");
    }

    return {
      applied_promo: null,
      discount_amount: 0
    };
  }

  try {
    await validatePromoCodeForCart({ promoCode, userId, subtotalAmount, trx });
  } catch (error) {
    if (throwOnInvalid) {
      throw error;
    }

    return {
      applied_promo: null,
      discount_amount: 0
    };
  }

  const discountAmount = calculatePromoDiscount(promoCode, subtotalAmount);

  return {
    applied_promo: {
      id: promoCode.id,
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      min_order_amount: promoCode.min_order_amount,
      description: promoCode.description,
      discount_amount: discountAmount
    },
    discount_amount: discountAmount
  };
}

// Виконує локальну логіку attach promo code to cart для модуля серверного модуля promotions.
async function attachPromoCodeToCart({ cartId, userId, code, trx = db }) {
  const promoCode = await getPromoCodeByCode(code, trx);
  const cart = await trx("carts").where({ id: cartId, user_id: userId }).first();

  if (!cart) {
    throw createHttpError(404, "CART_NOT_FOUND", "Active cart was not found");
  }

  const cartItems = await trx("cart_items").where({ cart_id: cartId });
  const subtotalAmount = roundCurrency(
    cartItems.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0)
  );

  await validatePromoCodeForCart({
    promoCode,
    userId,
    subtotalAmount,
    trx
  });

  await trx("carts").where({ id: cartId }).update({
    promo_code_id: promoCode.id,
    updated_at: trx.fn.now()
  });
}

// Виконує локальну логіку detach promo code from cart для модуля серверного модуля promotions.
async function detachPromoCodeFromCart({ cartId, trx = db }) {
  await trx("carts").where({ id: cartId }).update({
    promo_code_id: null,
    updated_at: trx.fn.now()
  });
}

// Виконує локальну логіку record promo code redemption для модуля серверного модуля promotions.
async function recordPromoCodeRedemption({ promoCodeId, userId, cartId, orderId, codeSnapshot, discountAmount, trx }) {
  if (!promoCodeId || !discountAmount) return;

  const promoCode = await getPromoCodeById(promoCodeId, trx);
  validatePromoCodeAvailability(promoCode);

  if (promoCode.max_redemptions != null) {
    const updatedPromoCodes = await trx("promo_codes")
      .where({ id: promoCodeId })
      .where("redemption_count", "<", promoCode.max_redemptions)
      .update({
        redemption_count: trx.raw("redemption_count + 1"),
        updated_at: trx.fn.now()
      });

    if (updatedPromoCodes !== 1) {
      throw createHttpError(422, "PROMO_CODE_LIMIT_REACHED", "Promo code redemption limit has been reached");
    }
  } else {
    await trx("promo_codes").where({ id: promoCodeId }).update({
      redemption_count: trx.raw("redemption_count + 1"),
      updated_at: trx.fn.now()
    });
  }

  await trx("promo_code_user_usage")
    .insert({
      promo_code_id: promoCodeId,
      user_id: userId,
      redemption_count: 0,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    })
    .onConflict(["promo_code_id", "user_id"])
    .ignore();

  if (promoCode.per_user_limit != null) {
    const updatedUsage = await trx("promo_code_user_usage")
      .where({
        promo_code_id: promoCodeId,
        user_id: userId
      })
      .where("redemption_count", "<", promoCode.per_user_limit)
      .update({
        redemption_count: trx.raw("redemption_count + 1"),
        updated_at: trx.fn.now()
      });

    if (updatedUsage !== 1) {
      throw createHttpError(422, "PROMO_CODE_USER_LIMIT", "Promo code usage limit for this account has been reached");
    }
  } else {
    await trx("promo_code_user_usage")
      .where({
        promo_code_id: promoCodeId,
        user_id: userId
      })
      .update({
        redemption_count: trx.raw("redemption_count + 1"),
        updated_at: trx.fn.now()
      });
  }

  await trx("promo_code_redemptions").insert({
    promo_code_id: promoCodeId,
    user_id: userId,
    cart_id: cartId || null,
    order_id: orderId || null,
    code_snapshot: codeSnapshot,
    discount_amount: discountAmount
  });
}

module.exports = {
  attachPromoCodeToCart,
  calculatePromoDiscount,
  detachPromoCodeFromCart,
  getPromoCodeByCode,
  getPromoCodeById,
  recordPromoCodeRedemption,
  resolveAppliedPromo,
  validatePromoCodeForCart
};
