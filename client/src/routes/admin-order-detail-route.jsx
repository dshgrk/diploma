import React, { useEffect, useState } from "react";
import { adminOrdersApi } from "../api";
import { AdminShell } from "../features/admin/admin-shell.jsx";
import { formatOrderDate, getPendantChainDisplay } from "../features/orders/order-format";
import {
  ADMIN_UI,
  adminOrderStatusLabel,
  adminStatusClassName,
  adminTypeCodeLabel
} from "../i18n/admin-copy";
import { formatCurrency } from "../utils";
import "../styles.css";

const ADMIN_LOCALE = "uk-UA";

function getOrderIdFromPath() {
  return window.location.pathname.split("/").filter(Boolean).at(-1);
}

export default function AdminOrderDetailRoute() {
  const orderId = getOrderIdFromPath();
  const [order, setOrder] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  async function loadOrder() {
    try {
      const result = await adminOrdersApi.getOrder(orderId);
      setOrder(result);
      setError("");
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        window.location.href = "/admin/login";
        return;
      }
      setError(err.message);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function updateStatus(nextStatus) {
    setIsUpdating(true);
    try {
      const result = await adminOrdersApi.updateOrderStatus(order.id, nextStatus, comment);
      setOrder(result);
      setComment("");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <AdminShell title={order?.order_number || ADMIN_UI.orderDetail.fallbackTitle} subtitle={ADMIN_UI.orderDetail.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      {!order ? <div className="empty-state-react"><h2>{ADMIN_UI.orderDetail.loading}</h2></div> : (
        <div className="admin-detail-grid">
          <section className="admin-panel">
            <h2>{order.customer_name}</h2>
            <p>{order.email} · {order.phone}</p>
            <p>{order.delivery_method}: {order.delivery_address}</p>
            <strong>{formatCurrency(order.total_amount, order.currency, ADMIN_LOCALE)}</strong>
          </section>
          <section className="admin-panel">
            <h2>{ADMIN_UI.orderDetail.status}</h2>
            <span className={adminStatusClassName(order.status, order.overdue)}>{adminOrderStatusLabel(order.status)}</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={ADMIN_UI.orderDetail.commentPlaceholder} />
            <div className="admin-action-row">
              {(order.available_statuses || []).map((status) => (
                <button className="button button-ghost" key={status} type="button" disabled={isUpdating} onClick={() => updateStatus(status)}>
                  {ADMIN_UI.orderDetail.moveTo} {adminOrderStatusLabel(status).toLowerCase()}
                </button>
              ))}
            </div>
          </section>
          <section className="admin-panel wide">
            <h2>{ADMIN_UI.orderDetail.items}</h2>
            <div className="order-items-list">
              {order.items.map((item) => {
                const chainDisplay = getPendantChainDisplay(item, ADMIN_LOCALE, {}, { includeMetal: true });
                return (
                  <div key={item.id}>
                    <span>{item.title} × {item.quantity}</span>
                    {item.item_type === "custom_design" && item.jewelry_type_code ? (
                      <p>{`${ADMIN_UI.orderDetail.productType}: ${adminTypeCodeLabel(item.jewelry_type_code)}`}</p>
                    ) : null}
                    {chainDisplay ? <p>{chainDisplay.text}</p> : null}
                    {chainDisplay?.surcharge ? <p>{chainDisplay.surcharge}</p> : null}
                    <strong>{formatCurrency(item.line_total, order.currency, ADMIN_LOCALE)}</strong>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="admin-panel wide">
            <h2>{ADMIN_UI.orderDetail.timeline}</h2>
            <div className="timeline-react">
              {order.history.map((entry) => (
                <article className="timeline-react-item" key={entry.id}>
                  <strong>{adminOrderStatusLabel(entry.new_status)}</strong>
                  <span>{formatOrderDate(entry.created_at, ADMIN_LOCALE)}</span>
                  {entry.comment ? <p>{entry.comment}</p> : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
