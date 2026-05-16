const { db } = require("../../db/knex");
const { parseJsonField } = require("../../utils/json");
const { serializeUser } = require("../auth/auth.service");
const { isOrderOverdue } = require("../orders/orders.service");

function orderSummary(order, items = [], updatedAt = null) {
  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    total_amount: Number(order.total_amount || 0),
    subtotal_amount: Number(order.subtotal_amount || 0),
    discount_amount: Number(order.discount_amount || 0),
    currency: order.currency,
    created_at: order.created_at,
    completed_at: order.completed_at,
    updated_at: updatedAt || order.created_at,
    overdue: isOrderOverdue(order),
    items: items.map((item) => ({
      id: item.id,
      item_type: item.item_type,
      product_type: item.product_type || null,
      jewelry_type_code: item.jewelry_type_code || null,
      title: item.title_snapshot,
      quantity: item.quantity,
      unit_price: Number(item.unit_price || 0),
      line_total: Number(item.line_total || 0),
      configuration: parseJsonField(item.configuration_json, {})
    }))
  };
}

async function getOrderItemsByOrderIds(orderIds) {
  if (!orderIds.length) return new Map();
  const rows = await db("order_items")
    .leftJoin("products", "order_items.product_id", "products.id")
    .leftJoin("jewelry_types", "order_items.jewelry_type_id", "jewelry_types.id")
    .whereIn("order_id", orderIds)
    .select("order_items.*", "products.filter_type as product_type", "jewelry_types.code as jewelry_type_code")
    .orderBy([{ column: "order_id", order: "asc" }, { column: "id", order: "asc" }]);
  const byOrderId = new Map();
  for (const row of rows) {
    const bucket = byOrderId.get(row.order_id) || [];
    bucket.push(row);
    byOrderId.set(row.order_id, bucket);
  }
  return byOrderId;
}

async function getLatestHistoryByOrderIds(orderIds) {
  if (!orderIds.length) return new Map();
  const rows = await db("order_status_history")
    .whereIn("order_id", orderIds)
    .orderBy([{ column: "order_id", order: "asc" }, { column: "created_at", order: "desc" }, { column: "id", order: "desc" }]);
  const byOrderId = new Map();
  for (const row of rows) {
    if (!byOrderId.has(row.order_id)) byOrderId.set(row.order_id, row);
  }
  return byOrderId;
}

async function getCurrentOrderForUser(userId) {
  const order = await db("orders")
    .where({ user_id: userId })
    .whereNot({ status: "completed" })
    .orderBy("created_at", "desc")
    .first();

  if (!order) return null;

  const [itemsByOrderId, latestHistoryByOrderId] = await Promise.all([
    getOrderItemsByOrderIds([order.id]),
    getLatestHistoryByOrderIds([order.id])
  ]);

  return orderSummary(order, itemsByOrderId.get(order.id) || [], latestHistoryByOrderId.get(order.id)?.created_at || null);
}

async function listCompletedOrdersForUser(userId) {
  const orders = await db("orders")
    .where({ user_id: userId, status: "completed" })
    .orderBy([{ column: "completed_at", order: "desc" }, { column: "created_at", order: "desc" }]);

  if (!orders.length) return [];

  const orderIds = orders.map((order) => order.id);
  const [itemsByOrderId, latestHistoryByOrderId] = await Promise.all([
    getOrderItemsByOrderIds(orderIds),
    getLatestHistoryByOrderIds(orderIds)
  ]);

  return orders.map((order) =>
    orderSummary(order, itemsByOrderId.get(order.id) || [], latestHistoryByOrderId.get(order.id)?.created_at || order.completed_at || null)
  );
}

async function getAccountDashboard(user) {
  const [currentOrder, completedOrders] = await Promise.all([
    getCurrentOrderForUser(user.id),
    listCompletedOrdersForUser(user.id)
  ]);

  return {
    user: serializeUser(user),
    current_order: currentOrder,
    completed_orders: completedOrders
  };
}

module.exports = {
  getAccountDashboard,
  getCurrentOrderForUser,
  listCompletedOrdersForUser
};
