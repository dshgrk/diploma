// Файл описує React-сторінку admin-orders-route та її локальну UI-логіку.
import React, { useEffect, useState } from "react";
import { adminOrdersApi } from "../api";
import { AdminShell } from "../features/admin/admin-shell.jsx";
import {
  ADMIN_UI,
  adminOrderStatusLabel,
  adminPaymentStateLabel,
  adminStatusClassName
} from "../i18n/admin-copy";
import { formatCurrency, formatCustomerName } from "../utils";
import "../styles.css";

const ADMIN_LOCALE = "uk-UA";

// Компонент рендерить блок admin metric і отримує потрібні дані через props або локальний state.
function AdminMetric({ label, value }) {
  return (
    <article className="admin-metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export default function AdminOrdersRoute() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminOrdersApi
      .listOrders(filters)
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401 || err.status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  const orders = data?.orders || [];
  const summary = data?.summary || {};

  return (
    <AdminShell title={ADMIN_UI.orders.title} subtitle={ADMIN_UI.orders.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-metric-grid">
        <AdminMetric label={ADMIN_UI.orders.total} value={summary.total_orders ?? 0} />
        <AdminMetric label={ADMIN_UI.orders.revenue} value={formatCurrency(summary.revenue_total || 0, "UAH", ADMIN_LOCALE)} />
        <AdminMetric label={ADMIN_UI.orders.average} value={formatCurrency(summary.average_order_value || 0, "UAH", ADMIN_LOCALE)} />
        <AdminMetric label={ADMIN_UI.orders.overdue} value={summary.overdue_orders ?? 0} />
      </div>
      <div className="admin-toolbar">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder={ADMIN_UI.orders.searchPlaceholder}
        />
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">{ADMIN_UI.orders.allStatuses}</option>
          <option value="created_pending_payment">{adminOrderStatusLabel("created_pending_payment")}</option>
          <option value="confirmed">{adminOrderStatusLabel("confirmed")}</option>
          <option value="in_progress">{adminOrderStatusLabel("in_progress")}</option>
          <option value="completed">{adminOrderStatusLabel("completed")}</option>
        </select>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{ADMIN_UI.orders.order}</th>
              <th>{ADMIN_UI.orders.customer}</th>
              <th>{ADMIN_UI.orders.status}</th>
              <th>{ADMIN_UI.orders.payment}</th>
              <th>{ADMIN_UI.orders.totalAmount}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="admin-order-id">{order.order_number}</td>
                <td>
                  <strong>{formatCustomerName(order.customer_name, order.email)}</strong>
                  <span>{order.email}</span>
                </td>
                <td><span className={adminStatusClassName(order.status, order.overdue)}>{adminOrderStatusLabel(order.status)}</span></td>
                <td>{adminPaymentStateLabel(order.payment_state)}</td>
                <td>{formatCurrency(order.total_amount, order.currency, ADMIN_LOCALE)}</td>
                <td><a className="small-button" href={`/admin/orders/${order.id}`}>{ADMIN_UI.common.open}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
