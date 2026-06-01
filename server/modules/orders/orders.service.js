const { db } = require("../../db/knex");
const { BUSINESS_RULES } = require("../../constants/business-rules");
const { CART_ITEM_TYPES } = require("../../constants/cart-item-types");
const { createHttpError } = require("../../utils/http-error");
const { parseJsonField } = require("../../utils/json");
const { pickLocalizedFields, resolveLocale } = require("../../utils/locale");
const { resolveProductImage } = require("../../utils/product-image");

function isOrderOverdue(order) {
  if (order.status !== "in_progress" || !order.in_progress_at) {
    return false;
  }

  const startedAt = new Date(order.in_progress_at).getTime();
  const deadline = startedAt + BUSINESS_RULES.OVERDUE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > deadline;
}

async function listOrdersForUser(userId) {
  const orders = await db("orders").where({ user_id: userId }).orderBy("created_at", "desc");
  return orders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    discount_amount: Number(order.discount_amount || 0),
    total_amount: Number(order.total_amount),
    currency: order.currency,
    created_at: order.created_at,
    overdue: isOrderOverdue(order)
  }));
}

async function getOrderDetailsForUser(userId, orderId, req) {
  const locale = resolveLocale(req);
  const order = await db("orders").where({ id: orderId, user_id: userId }).first();
  if (!order) {
    throw createHttpError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const items = await db("order_items")
    .leftJoin("products", "order_items.product_id", "products.id")
    .leftJoin("jewelry_types", "order_items.jewelry_type_id", "jewelry_types.id")
    .select(
      "order_items.*",
      "products.slug as product_slug",
      "products.filter_type as product_type",
      "products.name_uk as product_name_uk",
      "products.name_en as product_name_en",
      "jewelry_types.code as jewelry_type_code"
    )
    .where({ order_id: order.id })
    .orderBy("order_items.id", "asc");
  const history = await db("order_status_history").where({ order_id: order.id }).orderBy("created_at", "asc");
  const payments = await db("payments").where({ order_id: order.id }).orderBy("created_at", "desc");
  const pendingPayment = payments.find((payment) => payment.status === "pending" && payment.provider === "mock") || null;
  const productIds = items.map((item) => item.product_id).filter(Boolean);
  const productImages = productIds.length
    ? await db("product_images").whereIn("product_id", productIds).andWhere({ is_primary: true })
    : [];
  const imageByProductId = productImages.reduce((accumulator, image) => {
    accumulator[image.product_id] = image;
    return accumulator;
  }, {});

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    promo_code: order.promo_code_snapshot,
    discount_amount: Number(order.discount_amount || 0),
    total_amount: Number(order.total_amount),
    subtotal_amount: Number(order.subtotal_amount),
    currency: order.currency,
    delivery_method: order.delivery_method,
    delivery_address: order.delivery_address,
    customer_name: order.customer_name,
    email: order.email,
    phone: order.phone,
    created_at: order.created_at,
    confirmed_at: order.confirmed_at,
    in_progress_at: order.in_progress_at,
    completed_at: order.completed_at,
    overdue: isOrderOverdue(order),
    active_payment_token: order.status === "created_pending_payment" ? pendingPayment?.provider_payment_id || null : null,
    items: items.map((item) => {
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
        thumbnail_url: item.product_id ? resolveProductImage(imageByProductId[item.product_id]?.asset_path, item.jewelry_type_code, item.product_slug) : null,
        title: item.item_type === CART_ITEM_TYPES.READY_PRODUCT ? localizedProduct?.name || item.title_snapshot : item.title_snapshot,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        line_total: Number(item.line_total),
        configuration: parseJsonField(item.configuration_json, {})
      };
    }),
    history: history.map((entry) => ({
      id: entry.id,
      old_status: entry.old_status,
      new_status: entry.new_status,
      created_at: entry.created_at,
      comment: entry.comment
    })),
    payments: payments.map((payment) => ({
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      paid_at: payment.paid_at
    }))
  };
}

module.exports = {
  getOrderDetailsForUser,
  isOrderOverdue,
  listOrdersForUser
};
