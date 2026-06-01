import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cartApi, catalogApi } from "../api";
import {
  FALLBACK_PRODUCT_IMAGE,
  productAttributeEntries,
  productDisplayImage,
  productTypeLabel,
  referenceCopy
} from "../content";
import {
  getReadyProductDefaultSize,
  getReadyProductNormalizedSize,
  getReadyProductSizeDefinition,
  getReadyProductSizeLabel,
  getReadyProductSizeOptions,
  getReadyProductSizeTitle
} from "../ready-product";
import {
  getPendantChainColorNote,
  getPendantChainOptionLabel,
  getPendantChainOptions,
  getPendantChainUpsellNote,
  normalizePendantType,
  resolveReadyProductPendantChain
} from "../pendant-chain";
import { addGuestCartItem, MAX_CART_ITEM_QUANTITY } from "../features/cart/guest-cart";
import { announceCartAddition, syncCartCount } from "../features/cart/cart-events";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";

const PRODUCT_COPY = {
  uk: {
    addedPiece: "Виріб додано до замовлення.",
    adding: "Додаємо...",
    configuration: "Комплектація",
    loadingPiece: "Завантаження виробу",
    preparingProduct: "Готуємо деталі виробу.",
    productUnavailable: "Цей виріб недоступний",
    qty: "К-сть",
    returnToCollection: "Повернутися до колекції",
    trustDelivery: "Доставка по Україні",
    trustGuarantee: "Гарантія ательє",
    trustMaterials: "Сертифіковані матеріали"
  },
  en: {
    addedPiece: "Piece added to your order.",
    adding: "Adding...",
    configuration: "Configuration",
    loadingPiece: "Loading atelier piece",
    preparingProduct: "Preparing product details.",
    productUnavailable: "This piece is not available",
    qty: "Qty",
    returnToCollection: "Return to collection",
    trustDelivery: "Ukraine delivery",
    trustGuarantee: "Atelier Guarantee",
    trustMaterials: "Certified materials"
  }
};

function text(locale, key) {
  return PRODUCT_COPY[locale]?.[key] || PRODUCT_COPY.en[key] || key;
}

function getProductSlugFromPath() {
  return window.location.pathname.split("/").filter(Boolean).at(-1) || "";
}

export default function ProductRoute() {
  const { locale, toggleLocale } = usePublicLocale();
  const copy = referenceCopy(locale);
  const localeFormat = LOCALE_FORMATS[locale] || LOCALE_FORMATS.uk;
  const slug = getProductSlugFromPath();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedReadySize, setSelectedReadySize] = useState("");
  const [selectedChainOption, setSelectedChainOption] = useState("none");

  useEffect(() => {
    let active = true;

    catalogApi
      .getProduct(slug)
      .then((item) => {
        if (active) {
          setProduct(item);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, [slug, locale]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!product) return;
    setSelectedReadySize(getReadyProductDefaultSize(product, locale));
    setSelectedChainOption("none");
  }, [locale, product]);

  function showAddedFeedback(quantityValue, sizeCode, chain) {
    const sizeLabel = sizeCode ? getReadyProductSizeLabel(product, sizeCode, locale) : "";
    const chainLabel = chain?.option && chain.option !== "none" ? getPendantChainOptionLabel(chain.option, locale) : "";
    announceCartAddition({
      productSlug: product?.slug,
      quantity: quantityValue,
      size: sizeLabel,
      chain: chainLabel
    });
    setToast({
      kind: "success",
      title: text(locale, "addedPiece"),
      meta: [
        quantityValue > 1 ? `${text(locale, "qty")}: ${quantityValue}` : null,
        sizeLabel || null,
        chainLabel || null
      ]
        .filter(Boolean)
        .join(" · ")
    });
  }

  async function handleAddToCart() {
    if (!product) return;
    setIsAdding(true);
    const readyProductSize = getReadyProductNormalizedSize(product, selectedReadySize, locale);
    const readyChain = resolveReadyProductPendantChain(product, selectedChainOption);
    const quantity = Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(qty) || 1));
    const payload = {
      item_type: "ready_product",
      product_id: product.id,
      configuration: {
        ...(readyProductSize ? { size: readyProductSize } : {}),
        ...(readyChain ? { chainOption: readyChain.option } : {})
      },
      quantity
    };

    try {
      const cart = await cartApi.addItem(payload);
      syncCartCount(cart);
      showAddedFeedback(quantity, readyProductSize, readyChain);
    } catch (error) {
      if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
        const guestCart = addGuestCartItem({
          item_type: "ready_product",
          product_id: product.id,
          product_type: product.filters?.type || product.type || null,
          product_slug: product.slug,
          title: product.name,
          title_uk: product.name_uk || product.name,
          title_en: product.name_en || product.name,
          configuration: {
            ...(readyProductSize ? { size: readyProductSize } : {}),
            ...(readyChain ? { chain: readyChain } : {})
          },
          unit_price: Number(product.price || 0) + Number(readyChain?.price || 0),
          quantity
        });
        syncCartCount(guestCart);
        showAddedFeedback(quantity, readyProductSize, readyChain);
        return;
      }
      setToast({ kind: "error", title: error.message, meta: "" });
    } finally {
      setIsAdding(false);
    }
  }

  const primaryImage = product ? productDisplayImage(product) : FALLBACK_PRODUCT_IMAGE;
  const isPendantProduct = normalizePendantType(product);
  const readySizeOptions = product ? getReadyProductSizeOptions(product, locale) : [];
  const readySizeDefinition = product ? getReadyProductSizeDefinition(product) : null;
  const chainOptions = getPendantChainOptions(locale);
  const selectedChain = product ? resolveReadyProductPendantChain(product, selectedChainOption) : null;
  const selectedReadySizeLabel = readySizeOptions.find((item) => item.code === selectedReadySize)?.label || "";
  const displayFilters = product?.filters
    ? {
        ...product.filters,
        ringSize: product.filters.type === "Ring" && selectedReadySizeLabel ? selectedReadySizeLabel : product.filters.ringSize,
        braceletLength: product.filters.type === "Bracelet" && selectedReadySizeLabel ? selectedReadySizeLabel : product.filters.braceletLength
      }
    : null;
  const attributeEntries = productAttributeEntries(displayFilters, locale);
  const displayPrice = Number(product?.price || 0) + Number(selectedChain?.price || 0);

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main className="page-main">
        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h1>{text(locale, "productUnavailable")}</h1>
              <p>{loadError}</p>
              <a className="button" href="/catalog">
                {text(locale, "returnToCollection")}
              </a>
            </div>
          </section>
        ) : null}

        {!loadError && !product ? (
          <section className="section">
            <div className="container empty-state-react">
              <h1>{text(locale, "loadingPiece")}</h1>
              <p>{text(locale, "preparingProduct")}</p>
            </div>
          </section>
        ) : null}

        {product ? (
          <div className="section-inner" style={{ paddingTop: "2rem" }}>
            <a className="back-btn" href="/catalog">
              {copy.productBack}
            </a>
            <div className="product-layout">
              <div className="product-gallery">
                <div className="product-main-img">
                  <img src={primaryImage} alt={product.name} decoding="async" fetchPriority="high" />
                </div>
              </div>

              <div className="product-info">
                <p className="product-type-label">{productTypeLabel(product, locale)}</p>
                <h1 className="product-name">{product.name}</h1>
                <div className="product-price-row">
                  <span className="product-price">{formatCurrency(displayPrice, product.currency, localeFormat)}</span>
                </div>

                <div className="product-attrs">
                  {attributeEntries.map(([label, value]) => (
                    <div className="product-attr" key={label}>
                      <span className="product-attr-label">{label}</span>
                      <span className="product-attr-val">{value}</span>
                    </div>
                  ))}
                </div>

                {readySizeDefinition && readySizeOptions.length ? (
                  <div className="product-sizes">
                    <p className="product-attr-label" style={{ marginBottom: "0.75rem" }}>{getReadyProductSizeTitle(product, locale)}</p>
                    <div className="size-grid">
                      {readySizeOptions.map((size) => (
                        <button
                          className={`size-btn${selectedReadySize === size.code ? " active" : ""}`}
                          key={size.code}
                          type="button"
                          onClick={() => setSelectedReadySize(size.code)}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isPendantProduct ? (
                  <div className="product-sizes">
                    <p className="product-attr-label" style={{ marginBottom: "0.75rem" }}>{text(locale, "configuration")}</p>
                    <p className="product-desc-text" style={{ marginBottom: "1rem" }}>{getPendantChainUpsellNote(locale)}</p>
                    <div className="size-grid">
                      {chainOptions.map((option) => (
                        <button
                          className={`size-btn${selectedChainOption === option.code ? " active" : ""}`}
                          key={option.code}
                          type="button"
                          onClick={() => setSelectedChainOption(option.code)}
                        >
                          <span className="size-val">{option.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
                      <span>{getPendantChainColorNote(product?.filters?.metal, locale)}</span>
                      <span>{selectedChain?.price ? formatCurrency(selectedChain.price, product.currency, localeFormat) : locale === "uk" ? "0 грн" : "0 UAH"}</span>
                    </div>
                  </div>
                ) : null}

                <div className="product-desc">
                  <p className="product-attr-label" style={{ marginBottom: "0.5rem" }}>{copy.productDescription}</p>
                  <p className="product-desc-text">{product.description}</p>
                </div>

                <div className="product-actions">
                  <div className="qty-control">
                    <button className="qty-btn" type="button" onClick={() => setQty((current) => Math.max(1, current - 1))}>-</button>
                    <span className="qty-val">{qty}</span>
                    <button className="qty-btn" type="button" onClick={() => setQty((current) => Math.min(MAX_CART_ITEM_QUANTITY, current + 1))}>+</button>
                  </div>
                  <button className="button product-add-btn" type="button" onClick={handleAddToCart} disabled={isAdding}>
                    {isAdding ? text(locale, "adding") : copy.addToCart}
                  </button>
                </div>

                <div className="product-trust">
                  {["trustGuarantee", "trustDelivery", "trustMaterials"].map((key) => (
                    <div key={key} className="product-trust-item">
                      <Check aria-hidden="true" size={14} />
                      <span>{text(locale, key)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        </main>
        <Footer locale={locale} />
      </div>
      {toast ? (
        <div className={`react-toast ${toast.kind === "success" ? "react-toast-success" : "react-toast-error"}`}>
          <div className="react-toast-icon">{toast.kind === "success" ? <Check aria-hidden="true" size={16} /> : <X aria-hidden="true" size={16} />}</div>
          <div className="react-toast-copy">
            <strong>{toast.title}</strong>
            {toast.meta ? <span>{toast.meta}</span> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
