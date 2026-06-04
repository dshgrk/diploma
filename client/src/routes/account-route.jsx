// Файл описує React-сторінку account-route та її локальну UI-логіку.
import React, { useEffect, useState } from "react";
import { accountApi } from "../api";
import { formatOrderDate, getPendantChainDisplay } from "../features/orders/order-format";
import { orderStatusClassName, orderStatusLabel } from "../features/orders/order-status.js";
import { getReadyProductSizeLabel } from "../ready-product";
import { ORDERS_COPY, publicText } from "../i18n/public-copy";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";
import "../styles/orders-account.css";

// Виконує локальну логіку t для модуля сторінки account-route.
function t(locale, key) {
  return publicText(ORDERS_COPY, locale, key);
}

// Компонент рендерить блок account order line і отримує потрібні дані через props або локальний state.
function AccountOrderLine({ item, order, locale, localeFormat }) {
  const chainDisplay = getPendantChainDisplay(item, locale, {}, { includeLabel: false });
  return (
    <div className="account-order-item">
      <div>
        <strong>{item.title}</strong>
        <span>
          {locale === "uk" ? `Кількість: ${item.quantity}` : `Qty: ${item.quantity}`}
          {item.configuration?.size ? ` · ${getReadyProductSizeLabel(item.product_type, item.configuration.size, localeFormat)}` : ""}
          {chainDisplay ? ` · ${chainDisplay.text}` : ""}
        </span>
      </div>
      <strong>{formatCurrency(item.line_total, order.currency, localeFormat)}</strong>
    </div>
  );
}

// Компонент рендерить окрему картку активного замовлення користувача.
function ActiveOrderCard({ order, locale, localeFormat }) {
  return (
    <article className="account-history-card">
      <div className="account-panel-head">
        <div>
          <strong>{order.order_number}</strong>
          <p>{formatOrderDate(order.created_at, localeFormat)}</p>
        </div>
        <span className={orderStatusClassName(order.status, order.overdue)}>{orderStatusLabel(order.status, locale)}</span>
      </div>
      <div className="account-order-meta-row">
        <div>
          <span>{locale === "uk" ? "Створено" : "Created"}</span>
          <strong>{formatOrderDate(order.created_at, localeFormat)}</strong>
        </div>
        <div>
          <span>{locale === "uk" ? "Оновлено" : "Updated"}</span>
          <strong>{formatOrderDate(order.updated_at, localeFormat)}</strong>
        </div>
        <div>
          <span>{locale === "uk" ? "Позицій" : "Items"}</span>
          <strong>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong>
        </div>
        <div>
          <span>{locale === "uk" ? "Сума" : "Total"}</span>
          <strong>{formatCurrency(order.total_amount, order.currency, localeFormat)}</strong>
        </div>
      </div>
      <div className="account-order-items">
        {order.items.map((item) => (
          <AccountOrderLine key={item.id} item={item} order={order} locale={locale} localeFormat={localeFormat} />
        ))}
      </div>
      <a className="button button-ghost" href={`/orders/${order.id}`}>
        {locale === "uk" ? "Відкрити досьє замовлення" : "Open order dossier"}
      </a>
    </article>
  );
}

export default function AccountRoute() {
  const { locale, toggleLocale } = usePublicLocale();
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const [dashboard, setDashboard] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    accountApi
      .getDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          window.location.href = "/auth";
          return;
        }
        setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const user = dashboard?.user || null;
  const activeOrders = dashboard?.active_orders || [];
  const completedOrders = dashboard?.completed_orders || [];

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main>
          <section className="orders-react-hero">
            <div className="container orders-react-heading">
              <span className="badge">{locale === "uk" ? "Акаунт" : "Account"}</span>
              <h1>{locale === "uk" ? "Акаунт" : "Account"}</h1>
              <p>{locale === "uk" ? "Ваші замовлення, профіль і статуси ательє зібрані в одному просторі." : "Your orders, profile, and atelier statuses gathered in one space."}</p>
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

          {!loadError && !dashboard ? (
            <section className="section">
              <div className="container empty-state-react">
                <h2>{t(locale, "loadingOrder")}</h2>
                <p>{t(locale, "preparingDossier")}</p>
              </div>
            </section>
          ) : null}

          {dashboard ? (
            <section className="account-dashboard-section">
              <div className="container account-dashboard-grid">
                <section className="account-profile-card">
                  <span className="badge">{locale === "uk" ? "Профіль" : "Profile"}</span>
                  <h2>{user?.full_name || "Aurora Client"}</h2>
                  <div className="account-profile-meta">
                    <div>
                      <span>Email</span>
                      <strong>{user?.email || "—"}</strong>
                    </div>
                  </div>
                  <div className="account-profile-chip-row">
                    <span className="status-pill completed">
                      {user?.email_verified ? (locale === "uk" ? "Пошта підтверджена" : "Email verified") : (locale === "uk" ? "Пошта не підтверджена" : "Email not verified")}
                    </span>
                    <span className="status-pill pending">{user?.auth_provider === "google" ? "Google" : "Local"}</span>
                  </div>
                </section>

                <section className="account-current-order-card">
                  <div className="account-panel-head">
                    <div>
                      <span className="badge">{locale === "uk" ? "Поточні замовлення" : "Current orders"}</span>
                      <h2>{locale === "uk" ? "Активні замовлення" : "Active orders"}</h2>
                    </div>
                  </div>

                  {!activeOrders.length ? (
                    <div className="account-empty-block">
                      <p>{locale === "uk" ? "Зараз немає активних замовлень. Завершені вироби нижче в історії." : "You do not have an active order right now. Completed pieces are listed below."}</p>
                      <a className="button" href="/catalog">{t(locale, "chooseFirstPiece")}</a>
                    </div>
                  ) : (
                    <div className="account-active-orders-grid">
                      {activeOrders.map((order) => (
                        <ActiveOrderCard key={order.id} order={order} locale={locale} localeFormat={localeFormat} />
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="container account-history-stack">
                <div className="section-heading">
                  <span className="badge">{t(locale, "purchaseHistory")}</span>
                  <h2>{locale === "uk" ? "Завершені замовлення" : "Completed orders"}</h2>
                  <p>{locale === "uk" ? "Тут зберігається історія всіх завершених виробів із датами, сумами та складом замовлення." : "Here is the record of completed orders with dates, totals, and purchased pieces."}</p>
                </div>

                {!completedOrders.length ? (
                  <div className="empty-state-react">
                    <h2>{locale === "uk" ? "Поки немає завершених замовлень" : "No completed orders yet"}</h2>
                    <p>{locale === "uk" ? "Коли виріб буде завершений, він з’явиться тут." : "When a piece is completed, it will appear here."}</p>
                  </div>
                ) : (
                  <div className="account-history-grid">
                    {completedOrders.map((order) => (
                      <article className="account-history-card" key={order.id}>
                        <div className="account-panel-head">
                          <div>
                            <strong>{order.order_number}</strong>
                            <p>{formatOrderDate(order.completed_at || order.updated_at || order.created_at, localeFormat)}</p>
                          </div>
                          <span className="status-pill completed">{locale === "uk" ? "Завершено" : "Completed"}</span>
                        </div>
                        <div className="account-history-total">
                          <span>{t(locale, "orderTotal")}</span>
                          <strong>{formatCurrency(order.total_amount, order.currency, localeFormat)}</strong>
                        </div>
                        <div className="account-order-items">
                          {order.items.map((item) => (
                            <AccountOrderLine key={item.id} item={item} order={order} locale={locale} localeFormat={localeFormat} />
                          ))}
                        </div>
                        <a className="small-button" href={`/orders/${order.id}`}>
                          {locale === "uk" ? "Дивитися досьє" : "View dossier"}
                        </a>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </main>
        <Footer locale={locale} />
      </div>
    </>
  );
}
