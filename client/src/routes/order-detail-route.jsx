import React, { useEffect, useMemo, useState } from "react";
import { constructorApi, ordersApi } from "../api";
import { CartItemPreview } from "../features/orders/order-preview.jsx";
import { findTypeOptionLabel, formatOrderDate, getPendantChainDisplay } from "../features/orders/order-format";
import { ORDERS_COPY, publicText } from "../i18n/public-copy";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";

function t(locale, key) {
  return publicText(ORDERS_COPY, locale, key);
}

function orderStatusLabel(status, locale) {
  const labels = {
    created_pending_payment: t(locale, "awaitingPayment"),
    confirmed: t(locale, "confirmed"),
    in_progress: t(locale, "inProgress"),
    completed: t(locale, "completed")
  };
  return labels[status] || status;
}

function statusClassName(status, overdue = false) {
  if (overdue) return "status-pill overdue";
  if (status === "confirmed") return "status-pill confirmed";
  if (status === "in_progress") return "status-pill progress";
  if (status === "completed") return "status-pill completed";
  return "status-pill pending";
}

function OrderDetailItemCard({ item, order, locale, localeFormat, constructorConfig, typeById }) {
  const type = typeById[String(item.jewelry_type_id)] || null;
  const chainDisplay = getPendantChainDisplay(item, locale, typeById);

  return (
    <article className={`order-detail-item-card${item.item_type === "custom_design" ? " is-custom" : ""}`}>
      <div className="order-detail-item-main">
        <div className="order-detail-item-preview-wrap">
          <CartItemPreview item={item} constructorConfig={constructorConfig} />
        </div>
        <div className="order-detail-item-copy">
          <div className="order-detail-item-topline">
            <span className="badge subtle">{item.item_type === "custom_design" ? (locale === "uk" ? "Налаштований дизайн" : "Configured design") : (locale === "uk" ? "Готовий виріб" : "Finished piece")}</span>
          </div>
          <h3>{item.title}</h3>
          {item.item_type === "custom_design" ? (
            <div className="order-detail-item-meta-grid">
              <div className="order-detail-item-meta">
                <span>{locale === "uk" ? "Матеріал" : "Material"}</span>
                <strong>{findTypeOptionLabel(type?.materials, item.configuration?.material) || "-"}</strong>
              </div>
              {type?.size_options?.length ? (
                <div className="order-detail-item-meta">
                  <span>{locale === "uk" ? "Розмір" : "Size"}</span>
                  <strong>{findTypeOptionLabel(type?.size_options, item.configuration?.size) || "-"}</strong>
                </div>
              ) : null}
              {chainDisplay ? (
                <div className="order-detail-item-meta">
                  <span>{locale === "uk" ? "Комплектація" : "Configuration"}</span>
                  <strong>{chainDisplay.text.replace(/^Комплектація:\s|^Configuration:\s/, "")}</strong>
                </div>
              ) : null}
              {item.configuration?.engraving_text ? (
                <div className="order-detail-item-meta">
                  <span>{locale === "uk" ? "Гравіювання" : "Engraving"}</span>
                  <strong>{item.configuration.engraving_text}</strong>
                </div>
              ) : null}
            </div>
          ) : chainDisplay ? (
            <div className="order-detail-item-meta-grid">
              <div className="order-detail-item-meta">
                <span>{locale === "uk" ? "Комплектація" : "Configuration"}</span>
                <strong>{chainDisplay.text.replace(/^Комплектація:\s|^Configuration:\s/, "")}</strong>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <strong className="order-detail-item-price">{formatCurrency(item.line_total, order.currency, localeFormat)}</strong>
    </article>
  );
}

export default function OrderDetailRoute() {
  const orderId = window.location.pathname.split("/").filter(Boolean).at(-1);
  const { locale, toggleLocale } = usePublicLocale();
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const [order, setOrder] = useState(null);
  const [constructorConfig, setConstructorConfig] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    ordersApi
      .getOrder(orderId)
      .then((data) => {
        if (active) setOrder(data);
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
  }, [orderId]);

  useEffect(() => {
    let active = true;
    constructorApi
      .getConfig()
      .then((data) => {
        if (active) setConstructorConfig(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const typeById = useMemo(
    () => Object.fromEntries((constructorConfig?.types || []).map((entry) => [String(entry.id), entry])),
    [constructorConfig]
  );
  const activePayment = order?.payments?.find((payment) => payment.status === "succeeded") || order?.payments?.[0] || null;

  return (
    <>
      <AuroraBackground />
      <Header locale={locale} onToggleLocale={toggleLocale} />
      <main>
        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "orderDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !order ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "loadingOrder")}</h2>
              <p>{t(locale, "preparingDossier")}</p>
            </div>
          </section>
        ) : null}

        {order ? (
          <>
            <section className="order-detail-hero">
              <div className="container order-detail-head">
                <div className="order-detail-head-copy">
                  <span className="badge">{t(locale, "orderDossier")}</span>
                  <h1>{order.order_number}</h1>
                  <p>{locale === "uk" ? "Статус, склад замовлення та персональні деталі зібрані в одному спокійному досьє." : "Status, order composition, and personal details gathered in one calm dossier."}</p>
                </div>
                <div className="order-detail-status-stack">
                  <span className={statusClassName(order.status, order.overdue)}>{orderStatusLabel(order.status, locale)}</span>
                  <div className="order-detail-status-note">
                    <span>{locale === "uk" ? "Оновлено" : "Updated"}</span>
                    <strong>{formatOrderDate(order.history?.at(-1)?.created_at || order.created_at, localeFormat)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-detail-section">
              <div className="container order-detail-grid">
                <div className="order-detail-main-column">
                  <section className="order-detail-card order-detail-items-card">
                    <div className="section-heading">
                      <span className="badge">{t(locale, "orderItems")}</span>
                      <h2>{locale === "uk" ? "Ваші вироби" : "Your pieces"}</h2>
                      <p>{locale === "uk" ? "Кожен виріб показаний разом із деталями замовлення та персональним налаштуванням." : "Each piece is shown with order details and personal configuration."}</p>
                    </div>
                    <div className="order-detail-items-stack">
                      {order.items.map((item) => (
                        <OrderDetailItemCard
                          key={item.id}
                          item={item}
                          order={order}
                          locale={locale}
                          localeFormat={localeFormat}
                          constructorConfig={constructorConfig}
                          typeById={typeById}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="order-detail-card">
                    <div className="section-heading">
                      <span className="badge">{t(locale, "atelierTimeline")}</span>
                      <h2>{locale === "uk" ? "Таймлайн замовлення" : "Order timeline"}</h2>
                    </div>
                    <div className="timeline-react">
                      {order.history.map((entry) => (
                        <article className="timeline-react-item" key={entry.id}>
                          <strong>{orderStatusLabel(entry.new_status, locale)}</strong>
                          <span>{formatOrderDate(entry.created_at, localeFormat)}</span>
                          {entry.comment ? <p>{entry.comment}</p> : null}
                        </article>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="order-detail-side-column">
                  <section className="order-detail-card order-detail-summary-card">
                    <span className="badge subtle">{locale === "uk" ? "Резюме замовлення" : "Order summary"}</span>
                    <h2>{locale === "uk" ? "Готово до виготовлення" : "Ready for production"}</h2>
                    <div className="order-detail-total-box">
                      <span>{locale === "uk" ? "Підсумкова сума" : "Final total"}</span>
                      <strong>{formatCurrency(order.total_amount, order.currency, localeFormat)}</strong>
                    </div>
                    <div className="order-detail-meta-grid">
                      <div>
                        <span>{locale === "uk" ? "Позицій" : "Items"}</span>
                        <strong>{order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk" ? "Створено" : "Created"}</span>
                        <strong>{formatOrderDate(order.created_at, localeFormat)}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk" ? "Оплата" : "Payment"}</span>
                        <strong>{activePayment ? orderStatusLabel(order.status, locale) : locale === "uk" ? "Очікується" : "Pending"}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk" ? "Доставка" : "Delivery"}</span>
                        <strong>{order.delivery_method}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="order-detail-card">
                    <span className="badge subtle">{locale === "uk" ? "Контактні дані" : "Contact details"}</span>
                    <div className="order-detail-customer-grid">
                      <div>
                        <span>{locale === "uk" ? "Одержувач" : "Recipient"}</span>
                        <strong>{order.customer_name}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{order.email}</strong>
                      </div>
                      <div>
                        <span>{locale === "uk" ? "Телефон" : "Phone"}</span>
                        <strong>{order.phone}</strong>
                      </div>
                      <div className="is-wide">
                        <span>{locale === "uk" ? "Адреса доставки" : "Delivery address"}</span>
                        <strong>{order.delivery_address}</strong>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
            </section>
          </>
        ) : null}
      </main>
      <Footer locale={locale} />
    </>
  );
}
