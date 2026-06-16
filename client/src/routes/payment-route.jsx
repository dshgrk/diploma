// Файл описує React-сторінку payment-route та її локальну UI-логіку.
import React, { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { ordersApi } from "../api";
import { redirectToAuth } from "../features/cart/cart-events";
import { PAYMENT_COPY, publicText } from "../i18n/public-copy";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";
import "../styles/checkout-payment.css";

// Виконує локальну логіку t для модуля сторінки payment-route.
function t(locale, key) {
  return publicText(PAYMENT_COPY, locale, key);
}

// Форматує format card number у вигляд, зручний для відображення користувачу.
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

// Форматує format expiry у вигляд, зручний для відображення користувачу.
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function PaymentRoute() {
  const orderId = window.location.pathname.split("/").filter(Boolean).at(-1);
  const { locale, toggleLocale } = usePublicLocale();
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardHolder: "",
    cardNumber: "",
    expiryDate: "",
    cvc: ""
  });

  useEffect(() => {
    let active = true;

    ordersApi
      .getOrder(orderId)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        setPaymentConfirmed(data.status !== "created_pending_payment");
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
  }, [orderId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const orderTotal = useMemo(() => {
    if (!order) return "";
    return formatCurrency(order.total_amount, order.currency, localeFormat);
  }, [localeFormat, order]);

  const canSubmitPayment =
    cardForm.cardHolder.trim() &&
    cardForm.cardNumber.replace(/\s/g, "").length >= 16 &&
    cardForm.expiryDate.length === 5 &&
    cardForm.cvc.length === 3;

  function validatePaymentForm(nextForm = cardForm) {
    const errors = {};
    if (nextForm.cvc.length !== 3) {
      errors.cvc = t(locale, "cvcInvalid");
    }
    return errors;
  }

  // Оновлює існуючі дані update field без зміни решти стану.
  function updateField(event) {
    const { name, value } = event.target;
    setCardForm((current) => {
      const nextForm = {
        ...current,
        [name]:
          name === "cardNumber"
            ? formatCardNumber(value)
            : name === "expiryDate"
              ? formatExpiry(value)
              : name === "cvc"
                ? value.replace(/\D/g, "").slice(0, 3)
                : value
      };

      if (name === "cvc") {
        setFieldErrors((currentErrors) => ({
          ...currentErrors,
          cvc: nextForm.cvc.length === 0 || nextForm.cvc.length === 3 ? "" : t(locale, "cvcInvalid")
        }));
      }

      return nextForm;
    });
  }

  function handleFieldBlur(event) {
    if (event.target.name !== "cvc") return;
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      ...validatePaymentForm()
    }));
  }

  // Обробляє дію користувача або системну подію для handle confirm payment.
  async function handleConfirmPayment(event) {
    event.preventDefault();
    if (!order?.active_payment_token || order.status !== "created_pending_payment") {
      return;
    }
    const validationErrors = validatePaymentForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await ordersApi.confirmMockPayment({
        order_id: order.id,
        payment_token: order.active_payment_token
      });
      setOrder((current) =>
        current
          ? {
              ...current,
              status: "confirmed",
              active_payment_token: null,
              payments: current.payments?.map((payment) =>
                payment.status === "pending" ? { ...payment, status: "succeeded" } : payment
              )
            }
          : current
      );
      setPaymentConfirmed(true);
      setToast(t(locale, "paymentSuccessToast"));
    } catch (error) {
      setToast(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main>
          <section className="checkout-react-hero payment-react-hero">
            <div className="container checkout-react-heading payment-react-heading">
              <span className="badge">{t(locale, "securePayment")}</span>
              <h1>{t(locale, "paymentTitle")}</h1>
              <p>{t(locale, "paymentIntro")}</p>
            </div>
          </section>

          {loadError ? (
            <section className="section">
              <div className="container empty-state-react">
                <h2>{t(locale, "paymentDidNotLoad")}</h2>
                <p>{loadError}</p>
              </div>
            </section>
          ) : null}

          {!loadError && !order ? (
            <section className="section">
              <div className="container empty-state-react">
                <h2>{t(locale, "loadingPayment")}</h2>
                <p>{t(locale, "preparingPayment")}</p>
              </div>
            </section>
          ) : null}

          {order ? (
            <section className="checkout-workspace-section payment-workspace-section">
              <div className="container checkout-workspace payment-workspace">
                <section className="checkout-form-panel payment-form-panel">
                  <div className="section-heading">
                    <span className="badge">{t(locale, "securePayment")}</span>
                    <h2>{paymentConfirmed ? t(locale, "paymentSuccess") : t(locale, "paymentTitle")}</h2>
                    <p>{paymentConfirmed ? t(locale, "paymentSuccessCopy") : t(locale, "paymentHint")}</p>
                  </div>

                  {paymentConfirmed ? (
                    <div className="payment-success-card">
                      <div className="payment-success-icon">
                        <Check aria-hidden="true" />
                      </div>
                      <strong>{order.order_number}</strong>
                      <p>{t(locale, "orderAlreadyPaid")}</p>
                      <a className="button checkout-submit" href={`/account/orders/${order.id}`}>
                        {t(locale, "returnToOrder")}
                        <Check aria-hidden="true" />
                      </a>
                    </div>
                  ) : (
                    <form className="checkout-react-form payment-react-form" onSubmit={handleConfirmPayment} noValidate>
                      <div className="payment-card-visual checkout-full">
                        <div className="payment-card-topline">
                          <span>{order.order_number}</span>
                          <Lock aria-hidden="true" />
                        </div>
                        <strong>{orderTotal}</strong>
                        <p>Aurora Atelier</p>
                      </div>

                      <label>
                        <span>{t(locale, "cardHolder")}</span>
                        <input
                          name="cardHolder"
                          autoComplete="cc-name"
                          placeholder={locale === "uk" ? "Ім'я та прізвище" : "Name on card"}
                          value={cardForm.cardHolder}
                          onChange={updateField}
                        />
                      </label>
                      <label className="checkout-full">
                        <span>{t(locale, "cardNumber")}</span>
                        <div className="payment-input-wrap">
                          <CreditCard aria-hidden="true" />
                          <input
                            name="cardNumber"
                            autoComplete="cc-number"
                            inputMode="numeric"
                            placeholder="4242 4242 4242 4242"
                            value={cardForm.cardNumber}
                            onChange={updateField}
                          />
                        </div>
                      </label>
                      <div className="payment-inline-fields checkout-full">
                        <label>
                          <span>{t(locale, "expiryDate")}</span>
                          <input
                            name="expiryDate"
                            autoComplete="cc-exp"
                            inputMode="numeric"
                            placeholder="12/28"
                            value={cardForm.expiryDate}
                            onChange={updateField}
                          />
                        </label>
                        <label>
                          <span>{t(locale, "cvc")}</span>
                          <input
                            name="cvc"
                            autoComplete="cc-csc"
                            inputMode="numeric"
                            maxLength={3}
                            pattern="[0-9]{3}"
                            aria-invalid={Boolean(fieldErrors.cvc)}
                            placeholder="123"
                            value={cardForm.cvc}
                            onChange={updateField}
                            onBlur={handleFieldBlur}
                          />
                          {fieldErrors.cvc ? <small className="form-field-error">{fieldErrors.cvc}</small> : null}
                        </label>
                      </div>
                      <button className="button checkout-submit" type="submit" disabled={isSubmitting || !canSubmitPayment}>
                        {isSubmitting ? t(locale, "payingNow") : t(locale, "payNow")}
                        <ShieldCheck aria-hidden="true" />
                      </button>
                    </form>
                  )}
                </section>

                <aside className="checkout-summary-panel payment-summary-panel">
                  <span className="badge">{t(locale, "paymentSummary")}</span>
                  <h2>{order.order_number}</h2>
                  <div className="price-breakdown-card">
                    <div className="price-breakdown-row">
                      <span>{t(locale, "subtotal")}</span>
                      <strong>{formatCurrency(order.subtotal_amount, order.currency, localeFormat)}</strong>
                    </div>
                    {order.promo_code ? (
                      <div className="price-breakdown-promo">
                        <span className="badge subtle">{t(locale, "promoCode")}</span>
                        <strong>{order.promo_code}</strong>
                      </div>
                    ) : null}
                    {order.discount_amount > 0 ? (
                      <div className="price-breakdown-row is-discount">
                        <span>{t(locale, "discount")}</span>
                        <strong>-{formatCurrency(order.discount_amount, order.currency, localeFormat)}</strong>
                      </div>
                    ) : null}
                    <div className="checkout-total payment-total-highlight">
                      <span>{t(locale, "amountToPay")}</span>
                      <strong>{orderTotal}</strong>
                    </div>
                  </div>
                  <div className="checkout-items">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <span>{item.title}</span>
                        <strong>{formatCurrency(item.line_total, order.currency, localeFormat)}</strong>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          ) : null}
        </main>
        <Footer locale={locale} />
      </div>
      {toast ? <div className="react-toast">{toast}</div> : null}
    </>
  );
}
