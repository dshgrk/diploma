// Файл описує React-сторінку checkout-route та її локальну UI-логіку.
import React, { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { authApi, cartApi, ordersApi } from "../api";
import { redirectToAuth } from "../features/cart/cart-events";
import { getReadyProductSizeLabel } from "../ready-product";
import {
  extractValidationErrors,
  normalizeUkrainianPhone,
  sanitizePhoneDraft,
  validateCheckoutForm
} from "../public-form-validation";
import { CHECKOUT_COPY, publicText } from "../i18n/public-copy";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";
import "../styles/checkout-payment.css";

// Виконує локальну логіку t для модуля сторінки checkout-route.
function t(locale, key) {
  return publicText(CHECKOUT_COPY, locale, key);
}

export default function CheckoutRoute() {
  const { locale, toggleLocale } = usePublicLocale();
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const [cart, setCart] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    delivery_method: "nova_poshta",
    delivery_address: "",
    accepted_offer: false
  });

  useEffect(() => {
    let active = true;

    // Завантажує дані load checkout context з API або локального джерела.
    async function loadCheckoutContext() {
      try {
        const session = await authApi.getSession();
        if (!session?.authenticated || !session.user) {
          redirectToAuth();
          return;
        }

        const data = await cartApi.getCart();
        if (!active) return;
        setSessionUser(session.user);
        setForm((current) => ({
          ...current,
          customer_name: current.customer_name || session.user.full_name || "",
          email: session.user.email || current.email,
          phone: current.phone || session.user.phone || ""
        }));
        setCart(data);
      } catch (error) {
        if (!active) return;
        if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
          redirectToAuth();
          return;
        }
        setLoadError(error.message);
      }
    }

    loadCheckoutContext();

    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!cart?.applied_promo?.code) return;
    setPromoCodeInput(cart.applied_promo.code);
  }, [cart?.applied_promo?.code]);

  // Оновлює існуючі дані update form без зміни решти стану.
  function updateForm(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  function readApiErrorMessage(error) {
    return error?.payload?.error?.message || error?.message || "Request failed";
  }

  async function submitPromoCode() {
    const normalizedCode = String(promoCodeInput || "").trim();
    if (!normalizedCode) {
      setPromoError(t(locale, "promoCode"));
      return;
    }

    setPromoBusy(true);
    setPromoError("");
    try {
      const updated = await cartApi.applyPromoCode(normalizedCode);
      setCart(updated);
      setPromoCodeInput(updated?.applied_promo?.code || normalizedCode.toUpperCase());
      setToast(t(locale, "promoApplySuccess"));
    } catch (error) {
      setPromoError(readApiErrorMessage(error));
    } finally {
      setPromoBusy(false);
    }
  }

  async function clearPromoCode() {
    setPromoBusy(true);
    setPromoError("");
    try {
      const updated = await cartApi.removePromoCode();
      setCart(updated);
      setPromoCodeInput("");
    } catch (error) {
      setPromoError(readApiErrorMessage(error));
    } finally {
      setPromoBusy(false);
    }
  }

  // Обробляє дію користувача або системну подію для handle checkout.
  async function handleCheckout(event) {
    event.preventDefault();
    setFieldErrors({});
    const validation = validateCheckoutForm(form, locale);
    if (Object.keys(validation.errors).length > 0) {
      setFieldErrors(validation.errors);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await ordersApi.checkout({
        ...form,
        ...validation.values
      });
      setCreatedOrder(result);
      setToast(t(locale, "orderReservedToast"));
    } catch (error) {
      setFieldErrors(extractValidationErrors(error));
      setToast(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const items = cart?.items || [];
  const hasCustomDesign = items.some((item) => item.item_type === "custom_design");

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main>
        <section className="checkout-react-hero">
          <div className="container checkout-react-heading">
            <span className="badge">{t(locale, "secureCheckout")}</span>
            <h1>{t(locale, "confirmOrder")}</h1>
            <p>{t(locale, "checkoutIntro")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "checkoutDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !cart ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "loadingCheckout")}</h2>
              <p>{t(locale, "preparingReservation")}</p>
            </div>
          </section>
        ) : null}

        {cart && !items.length ? (
          <section className="section">
            <div className="container empty-state-react cart-empty-state">
              <span className="badge">{t(locale, "checkout")}</span>
              <h2>{t(locale, "nothingToReserve")}</h2>
              <p>{t(locale, "addBeforeCheckout")}</p>
              <a className="button" href="/catalog">
                {t(locale, "returnToCollection")}
              </a>
            </div>
          </section>
        ) : null}

        {cart && items.length ? (
          <section className="checkout-workspace-section">
            <div className="container checkout-workspace">
              <section className="checkout-form-panel">
                <div className="section-heading">
                  <span className="badge">{t(locale, "secureReservation")}</span>
                  <h2>{t(locale, "confirmDetails")}</h2>
                  <p>{t(locale, "confirmDetailsText")}</p>
                </div>

                <form className="checkout-react-form" onSubmit={handleCheckout} noValidate>
                  <label>
                    <span>{t(locale, "name")}</span>
                    <input
                      name="customer_name"
                      maxLength={120}
                      aria-invalid={Boolean(fieldErrors.customer_name)}
                      required
                      value={form.customer_name}
                      onChange={updateForm}
                    />
                    {fieldErrors.customer_name ? <small className="form-field-error">{fieldErrors.customer_name}</small> : null}
                  </label>
                  {sessionUser ? (
                    <label className="checkout-readonly-field">
                      <span>{t(locale, "email")}</span>
                      <input
                        className="checkout-readonly-input"
                        name="email"
                        type="email"
                        readOnly
                        aria-readonly="true"
                        value={sessionUser.email}
                      />
                    </label>
                  ) : null}
                  <label>
                    <span>{t(locale, "phone")}</span>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      required
                      value={form.phone}
                      onChange={(event) => {
                        updateForm({
                          target: {
                            name: event.target.name,
                            type: event.target.type,
                            checked: event.target.checked,
                            value: sanitizePhoneDraft(event.target.value)
                          }
                        });
                      }}
                      onBlur={() => setForm((current) => ({ ...current, phone: normalizeUkrainianPhone(current.phone) }))}
                    />
                    {fieldErrors.phone ? <small className="form-field-error">{fieldErrors.phone}</small> : null}
                  </label>
                  <label>
                    <span>{t(locale, "deliveryMethod")}</span>
                    <select name="delivery_method" aria-invalid={Boolean(fieldErrors.delivery_method)} required value={form.delivery_method} onChange={updateForm}>
                      <option value="nova_poshta">{t(locale, "novaPoshta")}</option>
                      <option value="courier">{t(locale, "courier")}</option>
                    </select>
                    {fieldErrors.delivery_method ? <small className="form-field-error">{fieldErrors.delivery_method}</small> : null}
                  </label>
                  <label className="checkout-full">
                    <span>{t(locale, "deliveryAddress")}</span>
                    <textarea
                      name="delivery_address"
                      maxLength={240}
                      aria-invalid={Boolean(fieldErrors.delivery_address)}
                      required
                      placeholder={t(locale, "addressPlaceholder")}
                      value={form.delivery_address}
                      onChange={updateForm}
                    />
                    {fieldErrors.delivery_address ? <small className="form-field-error">{fieldErrors.delivery_address}</small> : null}
                  </label>
                  {hasCustomDesign ? (
                    <div className="checkout-account-identity checkout-legal-notice checkout-full" role="note">
                      <span>{locale === "uk" ? "Персоналізоване замовлення" : "Personalized order"}</span>
                      <p>{t(locale, "customDesignNotice")}</p>
                    </div>
                  ) : null}
                  <label className="checkout-checkbox checkout-full">
                    <input
                      type="checkbox"
                      name="accepted_offer"
                      aria-invalid={Boolean(fieldErrors.accepted_offer)}
                      checked={form.accepted_offer}
                      onChange={updateForm}
                    />
                    <span>
                      {t(locale, "acceptOfferLead")}
                      <a className="checkout-legal-link" href="/oferta">
                        {t(locale, "acceptOfferLink")}
                      </a>
                      {t(locale, "acceptOfferTail")}
                    </span>
                    {fieldErrors.accepted_offer ? <small className="form-field-error">{fieldErrors.accepted_offer}</small> : null}
                  </label>
                  <button className="button checkout-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t(locale, "creatingOrder") : t(locale, "createOrder")}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </form>
              </section>

              <aside className="checkout-summary-panel">
                <span className="badge">{t(locale, "orderSummary")}</span>
                <h2>{t(locale, "reservedAfterPrepayment")}</h2>
                <div className="promo-form checkout-summary-promo">
                  <div className="checkout-promo-controls">
                    <label className="constructor-field" htmlFor="checkout-promo-code">
                      <span>{t(locale, "promoCode")}</span>
                      <input
                        id="checkout-promo-code"
                        type="text"
                        autoComplete="off"
                        placeholder=""
                        value={promoCodeInput}
                        disabled={promoBusy}
                        onChange={(event) => {
                          setPromoCodeInput(event.target.value.toUpperCase());
                          if (promoError) setPromoError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            submitPromoCode();
                          }
                        }}
                      />
                    </label>
                    <button
                      className="button button-outline"
                      type="button"
                      disabled={promoBusy}
                      onClick={submitPromoCode}
                    >
                      {t(locale, "applyPromo")}
                    </button>
                  </div>
                  {cart.applied_promo ? (
                    <div className="cart-promo-active" role="status">
                      <div>
                        <span className="badge subtle">{t(locale, "promoActive")}</span>
                        <strong>{cart.applied_promo.code}</strong>
                        <p>{cart.applied_promo.description || t(locale, "promoDescriptionFallback")}</p>
                      </div>
                      <button
                        type="button"
                        className="cart-promo-remove"
                        disabled={promoBusy}
                        onClick={clearPromoCode}
                      >
                        {t(locale, "promoRemove")}
                      </button>
                    </div>
                  ) : null}
                  {promoError ? <p className="cart-promo-error">{promoError}</p> : null}
                </div>
                <div className="price-breakdown-card">
                  <div className="price-breakdown-row">
                    <span>{t(locale, "subtotal")}</span>
                    <strong>{formatCurrency(cart.subtotal_amount, cart.currency, localeFormat)}</strong>
                  </div>
                  {cart.applied_promo ? (
                    <div className="price-breakdown-promo">
                      <span className="badge subtle">{t(locale, "promoCode")}</span>
                      <strong>{cart.applied_promo.code}</strong>
                    </div>
                  ) : null}
                  {cart.discount_amount > 0 ? (
                    <div className="price-breakdown-row is-discount">
                      <span>{t(locale, "discount")}</span>
                      <strong>-{formatCurrency(cart.discount_amount, cart.currency, localeFormat)}</strong>
                    </div>
                  ) : null}
                  <div className="checkout-total">
                    <span>{t(locale, "total")}</span>
                    <strong>{formatCurrency(cart.total_amount, cart.currency, localeFormat)}</strong>
                  </div>
                </div>

                <div className="checkout-items">
                  {items.map((item) => (
                    <div key={item.id}>
                      <span>
                        {item.title}
                        {item.configuration?.size ? ` · ${getReadyProductSizeLabel(item.product_type, item.configuration.size, localeFormat)}` : ""}
                      </span>
                      <strong>{formatCurrency(item.line_total, cart.currency, localeFormat)}</strong>
                    </div>
                  ))}
                </div>

                <p>{t(locale, "paymentCopy")}</p>

                <div className="checkout-steps">
                  <div>
                    <strong>1</strong>
                    <span>{t(locale, "stepOrderCreated")}</span>
                  </div>
                  <div>
                    <strong>2</strong>
                    <span>{t(locale, "stepPaymentConfirmed")}</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>{t(locale, "stepAtelierStarts")}</span>
                  </div>
                </div>

                {createdOrder ? (
                  <div className="payment-card">
                    <span className="badge">{createdOrder.order_number}</span>
                    <p>{t(locale, "orderReservedCopy")}</p>
                    <a className="button checkout-submit" href={`/payment/${createdOrder.order_id}`}>
                      {t(locale, "confirmDemoPayment")}
                      <Check aria-hidden="true" />
                    </a>
                  </div>
                ) : null}
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
