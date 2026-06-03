// Файл містить бізнес-логіку серверного модуля admin-orders та готує дані для API.
const { db } = require("../../db/knex");
const {
  ORDER_STATUSES,
  getAllowedOrderStatuses,
  getNextOrderStatus,
  isAdjacentOrderStatusTransition,
  isKnownOrderStatus
} = require("../../constants/order-statuses");
const { createHttpError } = require("../../utils/http-error");
const { parseJsonField } = require("../../utils/json");
const { sendOrderStatusNotification } = require("../notifications/notifications.service");
const { isOrderOverdue } = require("../orders/orders.service");

// Нормалізує normalize boolean filter, щоб API та UI працювали з однаковим форматом даних.
function normalizeBooleanFilter(value) {
  if (value === true || value === "true" || value === "1" || value === 1) return true;
  if (value === false || value === "false" || value === "0" || value === 0) return false;
  return null;
}

// Нормалізує normalize admin order filters, щоб API та UI працювали з однаковим форматом даних.
function normalizeAdminOrderFilters(query = {}) {
  return {
    status: isKnownOrderStatus(query.status) ? query.status : "",
    search: String(query.search || "").trim(),
    delivery_method: String(query.delivery_method || "").trim(),
    payment_state: ["paid", "unpaid"].includes(query.payment_state) ? query.payment_state : "",
    has_promo: normalizeBooleanFilter(query.has_promo),
    overdue_only: normalizeBooleanFilter(query.overdue_only) === true,
    date_from: String(query.date_from || "").trim(),
    date_to: String(query.date_to || "").trim()
  };
}

// Виконує локальну логіку map admin order для модуля серверного модуля admin-orders.
function mapAdminOrder(order) {
  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    email: order.email,
    phone: order.phone,
    delivery_method: order.delivery_method,
    status: order.status,
    next_allowed_status: getNextOrderStatus(order.status),
    available_statuses: getAllowedOrderStatuses(order.status),
    discount_amount: Number(order.discount_amount || 0),
    total_amount: Number(order.total_amount),
    currency: order.currency,
    created_at: order.created_at,
    has_promo: Boolean(order.promo_code_snapshot),
    payment_state: order.has_successful_payment ? "paid" : "unpaid",
    overdue: isOrderOverdue(order)
  };
}

// Формує структуру build admin orders summary для UI, API-відповіді або подальших розрахунків.
function buildAdminOrdersSummary(orders) {
  const revenueTotal = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const discountTotal = orders.reduce((sum, order) => sum + Number(order.discount_amount || 0), 0);
  const paidOrders = orders.filter((order) => order.payment_state === "paid").length;
  const promoOrders = orders.filter((order) => order.has_promo).length;
  const overdueOrders = orders.filter((order) => order.overdue).length;

  return {
    total_orders: orders.length,
    awaiting_payment: orders.filter((order) => order.status === ORDER_STATUSES.CREATED_PENDING_PAYMENT).length,
    confirmed_orders: orders.filter((order) => order.status === ORDER_STATUSES.CONFIRMED).length,
    in_progress_orders: orders.filter((order) => order.status === ORDER_STATUSES.IN_PROGRESS).length,
    completed_orders: orders.filter((order) => order.status === ORDER_STATUSES.COMPLETED).length,
    paid_orders: paidOrders,
    unpaid_orders: orders.length - paidOrders,
    overdue_orders: overdueOrders,
    promo_orders: promoOrders,
    revenue_total: Number(revenueTotal.toFixed(2)),
    discount_total: Number(discountTotal.toFixed(2)),
    average_order_value: orders.length ? Number((revenueTotal / orders.length).toFixed(2)) : 0
  };
}

// Повертає список даних list admin orders у форматі, готовому для API або UI.
async function listAdminOrders(query = {}) {
  const filters = normalizeAdminOrderFilters(query);
  const searchPattern = filters.search ? `%${filters.search.toLowerCase()}%` : "";

  const rows = await db("orders")
    .modify((builder) => {
      if (filters.status) {
        builder.where("status", filters.status);
      }

      if (filters.search) {
        builder.where((nested) => {
          nested
            .whereRaw("LOWER(orders.order_number) LIKE ?", [searchPattern])
            .orWhereRaw("LOWER(orders.customer_name) LIKE ?", [searchPattern])
            .orWhereRaw("LOWER(orders.email) LIKE ?", [searchPattern])
            .orWhereRaw("LOWER(orders.phone) LIKE ?", [searchPattern]);
        });
      }

      if (filters.delivery_method) {
        builder.where("orders.delivery_method", filters.delivery_method);
      }

      if (filters.has_promo === true) {
        builder.whereNotNull("orders.promo_code_snapshot");
      } else if (filters.has_promo === false) {
        builder.whereNull("orders.promo_code_snapshot");
      }

      if (filters.date_from) {
        builder.where("orders.created_at", ">=", `${filters.date_from} 00:00:00`);
      }

      if (filters.date_to) {
        builder.where("orders.created_at", "<=", `${filters.date_to} 23:59:59`);
      }
    })
    .orderBy("created_at", "desc");

  const orderIds = rows.map((order) => order.id);
  const successfulPayments = orderIds.length
    ? await db("payments")
        .select("order_id")
        .whereIn("order_id", orderIds)
        .andWhere({ status: "succeeded" })
    : [];
  const paidOrderIds = new Set(successfulPayments.map((payment) => Number(payment.order_id)));

  let orders = rows.map((order) =>
    mapAdminOrder({
      ...order,
      has_successful_payment: paidOrderIds.has(Number(order.id))
    })
  );

  if (filters.payment_state) {
    orders = orders.filter((order) => order.payment_state === filters.payment_state);
  }

  if (filters.overdue_only) {
    orders = orders.filter((order) => order.overdue);
  }

  const deliveryMethods = Array.from(new Set(rows.map((order) => order.delivery_method).filter(Boolean))).sort();

  return {
    orders,
    summary: buildAdminOrdersSummary(orders),
    filters,
    filter_options: {
      delivery_methods: deliveryMethods
    }
  };
}

// Отримує get admin order details з поточного набору даних або конфігурації.
async function getAdminOrderDetails(orderId) {
  const order = await db("orders").where({ id: orderId }).first();
  if (!order) {
    throw createHttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const items = await db("order_items")
    .leftJoin("products", "order_items.product_id", "products.id")
    .leftJoin("jewelry_types", "order_items.jewelry_type_id", "jewelry_types.id")
    .select(
      "order_items.*",
      "products.filter_type as product_type",
      "products.slug as product_slug",
      "jewelry_types.code as jewelry_type_code"
    )
    .where({ order_id: order.id })
    .orderBy("order_items.id", "asc");
  const history = await db("order_status_history")
    .leftJoin("users", "order_status_history.changed_by_user_id", "users.id")
    .select(
      "order_status_history.id",
      "order_status_history.old_status",
      "order_status_history.new_status",
      "order_status_history.created_at",
      "order_status_history.comment",
      "users.full_name as changed_by"
    )
    .where("order_status_history.order_id", order.id)
    .orderBy("order_status_history.created_at", "asc");
  const payments = await db("payments").where({ order_id: order.id }).orderBy("created_at", "desc");
  const notifications = await db("notification_logs").where({ order_id: order.id }).orderBy("created_at", "desc");

  return {
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    email: order.email,
    phone: order.phone,
    delivery_method: order.delivery_method,
    delivery_address: order.delivery_address,
    status: order.status,
    promo_code: order.promo_code_snapshot,
    discount_amount: Number(order.discount_amount || 0),
    total_amount: Number(order.total_amount),
    subtotal_amount: Number(order.subtotal_amount),
    currency: order.currency,
    created_at: order.created_at,
    confirmed_at: order.confirmed_at,
    in_progress_at: order.in_progress_at,
    completed_at: order.completed_at,
    overdue: isOrderOverdue(order),
    next_allowed_status: getNextOrderStatus(order.status),
    available_statuses: getAllowedOrderStatuses(order.status),
    items: items.map((item) => ({
      id: item.id,
      item_type: item.item_type,
      product_type: item.product_type || null,
      product_slug: item.product_slug || null,
      jewelry_type_code: item.jewelry_type_code || null,
      title: item.title_snapshot,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
      configuration: parseJsonField(item.configuration_json, {})
    })),
    history,
    payments: payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      paid_at: payment.paid_at,
      provider_payment_id: payment.provider_payment_id
    })),
    notifications: notifications.map((notification) => ({
      id: notification.id,
      channel: notification.channel,
      status: notification.status,
      recipient: notification.recipient,
      created_at: notification.created_at,
      sent_at: notification.sent_at,
      error_message: notification.error_message
    }))
  };
}

// Оновлює існуючі дані update admin order status без зміни решти стану.
async function updateAdminOrderStatus(adminUserId, orderId, nextStatus, comment) {
  const order = await db("orders").where({ id: orderId }).first();
  if (!order) {
    throw createHttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (!isKnownOrderStatus(nextStatus)) {
    throw createHttpError(422, "INVALID_STATUS", "Unknown order status");
  }

  if (nextStatus === order.status) {
    throw createHttpError(422, "STATUS_UNCHANGED", "Order already has this status");
  }

  const isRollback = nextStatus !== getNextOrderStatus(order.status);

  if (!isAdjacentOrderStatusTransition(order.status, nextStatus)) {
    throw createHttpError(422, "INVALID_STATUS_TRANSITION", "Only adjacent status transitions are allowed");
  }

  if (isRollback && !comment?.trim()) {
    throw createHttpError(422, "COMMENT_REQUIRED", "Comment is required when rolling an order back");
  }

  if ([ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.COMPLETED].includes(nextStatus)) {
    const successfulPayment = await db("payments")
      .where({
        order_id: order.id,
        status: "succeeded"
      })
      .first();

    if (!successfulPayment) {
      throw createHttpError(422, "PAYMENT_REQUIRED", "Order cannot move to the selected status without successful payment");
    }
  }

  await db.transaction(async (trx) => {
    const updates = {
      status: nextStatus,
      updated_at: trx.fn.now()
    };

    if (nextStatus === ORDER_STATUSES.CREATED_PENDING_PAYMENT) {
      updates.confirmed_at = null;
      updates.in_progress_at = null;
      updates.completed_at = null;
    } else if (nextStatus === ORDER_STATUSES.CONFIRMED) {
      updates.confirmed_at = order.confirmed_at || trx.fn.now();
      updates.in_progress_at = null;
      updates.completed_at = null;
    } else if (nextStatus === ORDER_STATUSES.IN_PROGRESS) {
      updates.confirmed_at = order.confirmed_at || trx.fn.now();
      updates.in_progress_at = order.in_progress_at || trx.fn.now();
      updates.completed_at = null;
    } else if (nextStatus === ORDER_STATUSES.COMPLETED) {
      updates.confirmed_at = order.confirmed_at || trx.fn.now();
      updates.in_progress_at = order.in_progress_at || trx.fn.now();
      updates.completed_at = trx.fn.now();
    }

    await trx("orders").where({ id: order.id }).update(updates);
    await trx("order_status_history").insert({
      order_id: order.id,
      old_status: order.status,
      new_status: nextStatus,
      changed_by_user_id: adminUserId,
      comment: comment?.trim() || (isRollback ? "Статус повернуто назад адміністратором" : "Статус оновлено адміністратором")
    });
  });

  const refreshedOrder = await db("orders").where({ id: order.id }).first();
  await sendOrderStatusNotification({ order: refreshedOrder, status: nextStatus });

  return getAdminOrderDetails(order.id);
}

module.exports = {
  getAdminOrderDetails,
  listAdminOrders,
  normalizeAdminOrderFilters,
  updateAdminOrderStatus
};
