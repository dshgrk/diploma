// Файл містить логіку замовлень.
import { ORDERS_COPY, publicText } from "../../i18n/public-copy";

// Виконує локальну логіку t для модуля замовлень.
function t(locale, key) {
  return publicText(ORDERS_COPY, locale, key);
}

// Виконує локальну логіку order status label для модуля замовлень.
export function orderStatusLabel(status, locale) {
  const labels = {
    created_pending_payment: t(locale, "awaitingPayment"),
    confirmed: t(locale, "confirmed"),
    in_progress: t(locale, "inProgress"),
    completed: t(locale, "completed")
  };
  return labels[status] || status;
}

// Виконує локальну логіку order status class name для модуля замовлень.
export function orderStatusClassName(status, overdue = false) {
  if (overdue) return "status-pill overdue";
  if (status === "confirmed") return "status-pill confirmed";
  if (status === "in_progress") return "status-pill progress";
  if (status === "completed") return "status-pill completed";
  return "status-pill pending";
}
