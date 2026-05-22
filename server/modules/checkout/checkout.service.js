const crypto = require("crypto");
const { db } = require("../../db/knex");
const { ORDER_STATUSES } = require("../../constants/order-statuses");
const { createHttpError } = require("../../utils/http-error");
const { generateOrderNumber } = require("../../utils/order-number");
const { buildActiveCartKey, getOrCreateActiveCart, serializeCart } = require("../cart/cart.service");
const { recordPromoCodeRedemption } = require("../promotions/promo-codes.service");
const { sendOrderStatusNotification } = require("../notifications/notifications.service");

function validateCheckoutPayload(payload) {
  const errors = {};
  if (!payload.customer_name?.trim()) errors.customer_name = "Customer name is required";
  if (!payload.phone?.trim()) errors.phone = "Phone is required";
  if (!payload.delivery_method?.trim()) errors.delivery_method = "Delivery method is required";
  if (!payload.delivery_address?.trim()) errors.delivery_address = "Delivery address is required";
  if (!payload.accepted_offer) errors.accepted_offer = "Offer acceptance is required";
  if (!payload.accepted_return_policy) errors.accepted_return_policy = "Return policy acceptance is required";

  if (Object.keys(errors).length > 0) {
    throw createHttpError(422, "VALIDATION_ERROR", "Checkout payload is invalid", errors);
  }
}

async function createCheckoutOrder(userId, payload) {
  validateCheckoutPayload(payload);

  const result = await db.transaction(async (trx) => {
    const user = await trx("users").where({ id: userId }).first();
    if (!user) {
      throw createHttpError(404, "USER_NOT_FOUND", "Authenticated user was not found");
    }

    const cart = await getOrCreateActiveCart(userId, { trx });
    const serializedCart = await serializeCart(cart.id, {
      userId,
      trx,
      throwOnInvalidPromo: true
    });

    if (!serializedCart.items.length) {
      throw createHttpError(400, "EMPTY_CART", "Cart is empty");
    }

    const updatedCartRows = await trx("carts")
      .where({
        id: cart.id,
        user_id: userId,
        status: "active"
      })
      .update({
        status: "checked_out",
        active_cart_key: null,
        updated_at: trx.fn.now()
      });

    if (updatedCartRows !== 1) {
      throw createHttpError(409, "CART_ALREADY_CHECKED_OUT", "Cart has already been checked out");
    }

    const orderNumber = generateOrderNumber();
    const [orderId] = await trx("orders").insert({
      order_number: orderNumber,
      user_id: userId,
      status: ORDER_STATUSES.CREATED_PENDING_PAYMENT,
      customer_name: payload.customer_name.trim(),
      email: String(user.email || payload.email || "").trim().toLowerCase(),
      phone: payload.phone.trim(),
      delivery_method: payload.delivery_method.trim(),
      delivery_address: payload.delivery_address.trim(),
      subtotal_amount: serializedCart.subtotal_amount,
      discount_amount: serializedCart.discount_amount,
      total_amount: serializedCart.total_amount,
      currency: serializedCart.currency,
      promo_code_id: serializedCart.applied_promo?.id || null,
      promo_code_snapshot: serializedCart.applied_promo?.code || null,
      accepted_offer_at: trx.fn.now(),
      accepted_return_policy_at: trx.fn.now()
    });

    await trx("order_items").insert(
      serializedCart.items.map((item) => ({
        order_id: orderId,
        item_type: item.item_type,
        product_id: item.product_id,
        jewelry_type_id: item.jewelry_type_id,
        title_snapshot: item.title,
        configuration_json: item.configuration && Object.keys(item.configuration).length ? JSON.stringify(item.configuration) : null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total
      }))
    );

    await trx("order_status_history").insert({
      order_id: orderId,
      old_status: null,
      new_status: ORDER_STATUSES.CREATED_PENDING_PAYMENT,
      changed_by_user_id: userId,
      comment: "Резерв створено після оформлення"
    });

    const paymentToken = `mock-${crypto.randomUUID()}`;
    await trx("payments").insert({
      order_id: orderId,
      provider: "mock",
      provider_payment_id: paymentToken,
      status: "pending",
      amount: serializedCart.total_amount,
      currency: serializedCart.currency,
      payload_json: JSON.stringify({ flow: "checkout" })
    });

    await recordPromoCodeRedemption({
      promoCodeId: serializedCart.applied_promo?.id || null,
      userId,
      cartId: cart.id,
      orderId,
      codeSnapshot: serializedCart.applied_promo?.code || null,
      discountAmount: serializedCart.discount_amount,
      trx
    });

    await trx("carts").insert({
      user_id: userId,
      status: "active",
      currency: serializedCart.currency,
      active_cart_key: buildActiveCartKey(userId)
    });

    return {
      order_id: orderId,
      order_number: orderNumber,
      amount: serializedCart.total_amount,
      currency: serializedCart.currency,
      payment_token: paymentToken,
      status: ORDER_STATUSES.CREATED_PENDING_PAYMENT
    };
  });

  const createdOrder = await db("orders").where({ id: result.order_id }).first();
  if (createdOrder) {
    await sendOrderStatusNotification({
      order: createdOrder,
      status: ORDER_STATUSES.CREATED_PENDING_PAYMENT
    });
  }

  return result;
}

module.exports = { createCheckoutOrder };
