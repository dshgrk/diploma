const { db } = require("../../db/knex");
const { ORDER_STATUSES } = require("../../constants/order-statuses");
const { createHttpError } = require("../../utils/http-error");
const { sendOrderStatusNotification } = require("../notifications/notifications.service");

async function confirmMockPayment(user, payload) {
  if (!payload.order_id || !payload.payment_token) {
    throw createHttpError(422, "VALIDATION_ERROR", "order_id and payment_token are required");
  }

  const order = await db("orders").where({ id: Number(payload.order_id) }).first();
  if (!order) {
    throw createHttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (user.role !== "admin" && order.user_id !== user.id) {
    throw createHttpError(403, "FORBIDDEN", "You cannot pay for another user's order");
  }

  const payment = await db("payments")
    .where({
      order_id: order.id,
      provider_payment_id: payload.payment_token
    })
    .first();

  if (!payment) {
    throw createHttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (payment.status === "succeeded") {
    return {
      order_id: order.id,
      payment_status: payment.status,
      order_status: order.status
    };
  }

  if (payment.status === "failed") {
    throw createHttpError(422, "PAYMENT_ALREADY_FAILED", "This payment attempt has already failed");
  }

  if (order.status !== ORDER_STATUSES.CREATED_PENDING_PAYMENT) {
    throw createHttpError(
      422,
      "INVALID_ORDER_STATUS_FOR_PAYMENT",
      "Order is not awaiting payment confirmation"
    );
  }

  if (payload.payment_result && payload.payment_result !== "success") {
    await db("payments").where({ id: payment.id }).update({
      status: "failed",
      payload_json: JSON.stringify({ result: payload.payment_result })
    });
    throw createHttpError(422, "PAYMENT_FAILED", "Payment confirmation failed");
  }

  const result = await db.transaction(async (trx) => {
    const currentOrder = await trx("orders").where({ id: order.id }).first();
    const currentPayment = await trx("payments")
      .where({
        id: payment.id,
        order_id: order.id,
        provider_payment_id: payload.payment_token
      })
      .first();

    if (!currentOrder || !currentPayment) {
      throw createHttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }

    if (currentPayment.status === "succeeded") {
      return {
        order_id: currentOrder.id,
        payment_status: currentPayment.status,
        order_status: currentOrder.status,
        notify: false
      };
    }

    if (currentPayment.status === "failed") {
      throw createHttpError(422, "PAYMENT_ALREADY_FAILED", "This payment attempt has already failed");
    }

    if (currentOrder.status !== ORDER_STATUSES.CREATED_PENDING_PAYMENT) {
      throw createHttpError(
        422,
        "INVALID_ORDER_STATUS_FOR_PAYMENT",
        "Order is not awaiting payment confirmation"
      );
    }

    const updatedPayments = await trx("payments").where({ id: currentPayment.id, status: "pending" }).update({
      status: "succeeded",
      paid_at: trx.fn.now(),
      payload_json: JSON.stringify({ result: "success" })
    });

    if (updatedPayments !== 1) {
      const refreshedPayment = await trx("payments").where({ id: currentPayment.id }).first();
      const refreshedOrder = await trx("orders").where({ id: currentOrder.id }).first();

      return {
        order_id: refreshedOrder.id,
        payment_status: refreshedPayment.status,
        order_status: refreshedOrder.status,
        notify: false
      };
    }

    const updatedOrders = await trx("orders")
      .where({
        id: currentOrder.id,
        status: ORDER_STATUSES.CREATED_PENDING_PAYMENT
      })
      .update({
        status: ORDER_STATUSES.CONFIRMED,
        confirmed_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });

    if (updatedOrders !== 1) {
      throw createHttpError(
        409,
        "ORDER_STATUS_CHANGED",
        "Order status changed while payment confirmation was being processed"
      );
    }

    await trx("order_status_history").insert({
      order_id: currentOrder.id,
      old_status: currentOrder.status,
      new_status: ORDER_STATUSES.CONFIRMED,
      changed_by_user_id: user.id,
      comment: "Передплату підтверджено"
    });

    return {
      order_id: currentOrder.id,
      payment_status: "succeeded",
      order_status: ORDER_STATUSES.CONFIRMED,
      notify: true
    };
  });

  if (result.notify) {
    const refreshedOrder = await db("orders").where({ id: order.id }).first();
    await sendOrderStatusNotification({
      order: refreshedOrder,
      status: ORDER_STATUSES.CONFIRMED
    });
  }

  return {
    order_id: result.order_id,
    payment_status: result.payment_status,
    order_status: result.order_status
  };
}

module.exports = { confirmMockPayment };
