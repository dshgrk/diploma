// Файл описує React-сторінку orders-route та її локальну UI-логіку.
import React, { useEffect, useState } from "react";
import { ordersApi } from "../api";
import { redirectToAuth } from "../features/cart/cart-events";
import { formatOrderDate } from "../features/orders/order-format";
import { orderStatusClassName, orderStatusLabel } from "../features/orders/order-status.js";
import { ORDERS_COPY, publicText } from "../i18n/public-copy";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";
import "../styles/orders-account.css";

// Виконує локальну логіку t для модуля сторінки orders-route.
function t(locale, key) {
  return publicText(ORDERS_COPY, locale, key);
}

export default function OrdersRoute() {
  const { locale, toggleLocale } = usePublicLocale();
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (window.location.pathname === "/orders") {
      window.history.replaceState({}, "", "/account/orders");
    }
  }, []);

  useEffect(() => {
    let active = true;
    ordersApi
      .getMyOrders()
      .then((data) => {
        if (active) setOrders(data || []);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          redirectToAuth();
          return;
        }
        setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main>
        <section className="orders-react-hero">
          <div className="container orders-react-heading">
            <a className="orders-back-link" href="/account">
              {t(locale, "backToAccount")}
            </a>
            <span className="badge">{t(locale, "purchaseHistory")}</span>
            <h1>{t(locale, "myOrders")}</h1>
            <p>{t(locale, "ordersIntro")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "ordersDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !orders ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "loadingOrders")}</h2>
              <p>{t(locale, "preparingHistory")}</p>
            </div>
          </section>
        ) : null}

        {orders && !orders.length ? (
          <section className="section">
            <div className="container empty-state-react cart-empty-state">
              <span className="badge">{t(locale, "atelierHistory")}</span>
              <h2>{t(locale, "noOrdersTitle")}</h2>
              <p>{t(locale, "noOrdersText")}</p>
              <a className="button" href="/catalog">
                {t(locale, "chooseFirstPiece")}
              </a>
            </div>
          </section>
        ) : null}

        {orders && orders.length ? (
          <section className="orders-list-section">
            <div className="container orders-list-grid">
              {orders.map((order) => (
                <a className="order-card-react" href={`/account/orders/${order.id}`} key={order.id}>
                  <div className="order-card-top">
                    <div>
                      <strong>{order.order_number}</strong>
                      <p>{formatOrderDate(order.created_at, localeFormat)}</p>
                    </div>
                    <span className={orderStatusClassName(order.status, order.overdue)}>{orderStatusLabel(order.status, locale)}</span>
                  </div>
                  <div className="order-card-total">
                    <span>{t(locale, "orderTotal")}</span>
                    <strong>{formatCurrency(order.total_amount, order.currency, localeFormat)}</strong>
                  </div>
                  <p className={order.overdue ? "cart-warning" : ""}>
                    {order.overdue ? t(locale, "orderAttention") : t(locale, "orderOnSchedule")}
                  </p>
                </a>
              ))}
            </div>
          </section>
        ) : null}
        </main>
        <Footer locale={locale} />
      </div>
    </>
  );
}
