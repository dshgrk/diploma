import { ORDERS_COPY, publicText } from "../../i18n/public-copy";

function t(locale, key) {
  return publicText(ORDERS_COPY, locale, key);
}

export function orderStatusLabel(status, locale) {
  const labels = {
    created_pending_payment: t(locale, "awaitingPayment"),
    confirmed: t(locale, "confirmed"),
    in_progress: t(locale, "inProgress"),
    completed: t(locale, "completed")
  };
  return labels[status] || status;
}

export function orderStatusClassName(status, overdue = false) {
  if (overdue) return "status-pill overdue";
  if (status === "confirmed") return "status-pill confirmed";
  if (status === "in_progress") return "status-pill progress";
  if (status === "completed") return "status-pill completed";
  return "status-pill pending";
}
