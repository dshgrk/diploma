import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
import { authApi, cartApi, constructorApi } from "../api";
import { referenceCopy } from "../content";
import { getReadyProductSizeLabel, getReadyProductSizeTitle } from "../ready-product";
import { MAX_CART_ITEM_QUANTITY, readGuestCart, removeGuestCartItem, updateGuestCartItem } from "../features/cart/guest-cart";
import { setPostAuthRedirect, syncCartCount } from "../features/cart/cart-events";
import { CartItemPreview } from "../features/orders/order-preview.jsx";
import { findTypeOptionLabel, getPendantChainDisplay } from "../features/orders/order-format";
import { CART_COPY, publicText } from "../i18n/public-copy";
import { sanitizeQuantityInput } from "../public-form-validation";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";

function t(locale, copy, key) {
  return publicText(CART_COPY, locale, key) || copy[key] || key;
}

export default function CartRoute() {
  const { locale, toggleLocale } = usePublicLocale();
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const copy = referenceCopy(locale);
  const [cart, setCart] = useState(null);
  const [constructorConfig, setConstructorConfig] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [busyItemId, setBusyItemId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCartState() {
      try {
        const session = await authApi.getSession();
        if (session?.authenticated) {
          const data = await cartApi.getCart();
          if (active) {
            setIsAuthenticated(true);
            setCart(data);
            syncCartCount(data);
          }
          return;
        }
      } catch {}

      if (active) {
        const guestCart = readGuestCart();
        setIsAuthenticated(false);
        setCart(guestCart);
        syncCartCount(guestCart);
      }
    }

    loadCartState().catch((error) => {
      if (active) setLoadError(error.message);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    constructorApi
      .getConfig()
      .then((data) => {
        if (active) setConstructorConfig(data);
      })
      .catch(() => {
        if (active) setConstructorConfig(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const items = cart?.items || [];
  const typeById = useMemo(
    () => Object.fromEntries((constructorConfig?.types || []).map((entry) => [String(entry.id), entry])),
    [constructorConfig]
  );

  async function updateQuantity(item, quantity) {
    const nextQuantity = sanitizeQuantityInput(quantity, MAX_CART_ITEM_QUANTITY);
    setBusyItemId(item.id);
    try {
      const updated = isAuthenticated
        ? await cartApi.updateItem(item.id, { quantity: nextQuantity })
        : updateGuestCartItem(item.id, nextQuantity);
      setCart(updated);
      syncCartCount(updated);
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(item) {
    setBusyItemId(item.id);
    try {
      const updated = isAuthenticated
        ? await cartApi.deleteItem(item.id)
        : removeGuestCartItem(item.id);
      setCart(updated);
      syncCartCount(updated);
      setToast(t(locale, copy, "itemRemoved"));
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusyItemId(null);
    }
  }

  function handleProceedCheckout(event) {
    if (!isAuthenticated) {
      event.preventDefault();
      setPostAuthRedirect("/checkout");
      window.location.href = "/auth";
    }
  }

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main>
        <section className="cart-react-hero">
          <div className="container cart-react-heading">
            <span className="badge">{t(locale, copy, "almostThere")}</span>
            <h1>{t(locale, copy, "yourCart")}</h1>
            <p>{t(locale, copy, "cartIntro")}</p>
          </div>
        </section>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, copy, "cartDidNotLoad")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && !cart ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, copy, "loadingCart")}</h2>
              <p>{t(locale, copy, "preparingCart")}</p>
            </div>
          </section>
        ) : null}

        {cart && !items.length ? (
          <section className="section">
            <div className="container empty-state-react cart-empty-state">
              <span className="badge">{t(locale, copy, "orderEdit")}</span>
              <h2>{t(locale, copy, "emptyCartTitle")}</h2>
              <p>{t(locale, copy, "emptyCartText")}</p>
              <div className="hero-actions">
                <a className="button" href="/catalog">
                  {t(locale, copy, "exploreCollection")}
                </a>
                <a className="button button-outline" href="/constructor">
                  {t(locale, copy, "addCustomDesign")}
                </a>
              </div>
            </div>
          </section>
        ) : null}

        {cart && items.length ? (
          <section className="cart-workspace-section">
            <div className="container cart-workspace">
              <div className="cart-items-panel">
                <div className="section-heading">
                  <span className="badge">{t(locale, copy, "orderEdit")}</span>
                  <h2>{t(locale, copy, "selectedPieces")}</h2>
                </div>
                <div className="cart-item-list">
                  {items.map((item) => (
                    <article className={`cart-react-item${item.item_type === "custom_design" ? " is-custom" : ""}`} key={item.id}>
                      <div className="cart-item-main">
                        <div className="cart-item-preview-wrap">
                          <CartItemPreview item={item} constructorConfig={constructorConfig} />
                        </div>
                        <div className="cart-item-copy">
                          <div className="cart-item-head">
                            <div>
                              <span className="badge subtle">{item.item_type === "custom_design" ? t(locale, copy, "configuredDesign") : t(locale, copy, "finishedPiece")}</span>
                              <h3>{item.title}</h3>
                            </div>
                          </div>

                          {item.item_type === "custom_design" ? (
                            <div className="cart-item-meta-grid">
                              {typeById[String(item.jewelry_type_id)]?.size_options?.length ? (
                                <div className="cart-item-meta">
                                  <span>{localeFormat === "uk-UA" ? "Розмір" : "Size"}</span>
                                  <strong>{findTypeOptionLabel(typeById[String(item.jewelry_type_id)]?.size_options, item.configuration?.size) || "-"}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById) ? (
                                <div className="cart-item-meta">
                                  <span>{localeFormat === "uk-UA" ? "Комплектація" : "Configuration"}</span>
                                  <strong>{getPendantChainDisplay(item, locale, typeById, { includeLabel: false }).text}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById)?.surcharge ? (
                                <div className="cart-item-meta">
                                  <span>{localeFormat === "uk-UA" ? "Доплата за ланцюжок" : "Chain surcharge"}</span>
                                  <strong>{formatCurrency(Number(getPendantChainDisplay(item, locale, typeById).chain?.price || 0), cart.currency, localeFormat)}</strong>
                                </div>
                              ) : null}
                              {item.configuration?.engraving_text ? (
                                <div className="cart-item-meta">
                                  <span>{localeFormat === "uk-UA" ? "Гравіювання" : "Engraving"}</span>
                                  <strong>{item.configuration.engraving_text}</strong>
                                </div>
                              ) : null}
                            </div>
                          ) : item.configuration?.size || getPendantChainDisplay(item, locale, typeById) ? (
                            <div className="cart-item-meta-grid">
                              {item.configuration?.size ? (
                                <div className="cart-item-meta">
                                  <span>{getReadyProductSizeTitle(item.product_type, localeFormat)}</span>
                                  <strong>{getReadyProductSizeLabel(item.product_type, item.configuration.size, localeFormat)}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById) ? (
                                <div className="cart-item-meta">
                                  <span>{localeFormat === "uk-UA" ? "Комплектація" : "Configuration"}</span>
                                  <strong>{getPendantChainDisplay(item, locale, typeById, { includeLabel: false }).text}</strong>
                                </div>
                              ) : null}
                              {getPendantChainDisplay(item, locale, typeById)?.surcharge ? (
                                <div className="cart-item-meta">
                                  <span>{localeFormat === "uk-UA" ? "Доплата за ланцюжок" : "Chain surcharge"}</span>
                                  <strong>{formatCurrency(Number(getPendantChainDisplay(item, locale, typeById).chain?.price || 0), cart.currency, localeFormat)}</strong>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          {item.item_type === "ready_product" && item.product_slug ? (
                            <a className="text-cta" href={`/products/${item.product_slug}`}>
                              {t(locale, copy, "viewPiece")}
                              <ChevronRight aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <div className="cart-item-controls">
                        <div className="cart-item-controls-top">
                          <div className="cart-item-control-cluster">
                            <label className="cart-quantity">
                              <span>{t(locale, copy, "qty")}</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                max={MAX_CART_ITEM_QUANTITY}
                                inputMode="numeric"
                                value={item.quantity}
                                disabled={busyItemId === item.id}
                                onChange={(event) => updateQuantity(item, event.target.value)}
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            className="cart-remove-button"
                            disabled={busyItemId === item.id}
                            onClick={() => removeItem(item)}
                            aria-label={`${t(locale, copy, "remove")} ${item.title}`}
                          >
                            <Trash2 aria-hidden="true" />
                          </button>
                        </div>
                        <strong className="cart-item-price">{formatCurrency(item.line_total, cart.currency, localeFormat)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="cart-summary-panel">
                <span className="badge">{t(locale, copy, "reservationSummary")}</span>
                <h2>{t(locale, copy, "readyCheckout")}</h2>
                <div className="cart-summary-total">
                  <span>{t(locale, copy, "subtotal")}</span>
                  <strong>{formatCurrency(cart.subtotal_amount, cart.currency, localeFormat)}</strong>
                </div>
                <a className="button cart-checkout-button" href="/checkout" onClick={handleProceedCheckout}>
                  {t(locale, copy, "proceedCheckout")}
                  <ChevronRight aria-hidden="true" />
                </a>
                {!isAuthenticated ? (
                  <p className="cart-guest-note">{localeFormat === "uk-UA" ? "Щоб оформити замовлення, увійдіть або зареєструйтесь. Кошик не зникне і закріпиться за вашим акаунтом." : "To place the order, sign in or create an account. Your cart will stay intact and attach to your account."}</p>
                ) : null}
                <a className="button button-outline" href="/constructor">
                  {t(locale, copy, "addCustomDesign")}
                </a>
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
