import React, { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cartApi, constructorApi } from "../api";
import {
  extractPendantChainOption,
  getPendantChainColorNote,
  getPendantChainOptions,
  getPendantChainUpsellNote,
  normalizePendantType,
  resolveCustomDesignPendantChain
} from "../pendant-chain";
import { buildStoneCodeMap, JewelryPreview, previewStoneStyle } from "../jewelry-preview";
import { referenceCopy } from "../content";
import { formatCurrency } from "../utils";
import { AuroraBackground, Footer, Header, LOCALE_FORMATS, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";

const GUEST_CART_STORAGE_KEY = "aurora-guest-cart";

const UI = {
  uk: {
    addToCart: "Додати в кошик",
    adding: "Додаємо...",
    calculating: "Розрахунок...",
    constructorUnavailable: "Конструктор тимчасово недоступний",
    currentPrice: "Поточна ціна",
    jewelryType: "Тип прикраси",
    piece: "Прикраса",
    validated: "Перевірено",
    personalDesign: "Персональний дизайн"
  },
  en: {
    addToCart: "Add to cart",
    adding: "Adding...",
    calculating: "Calculating...",
    constructorUnavailable: "Constructor is temporarily unavailable",
    currentPrice: "Current price",
    jewelryType: "Jewelry type",
    piece: "Piece",
    validated: "Validated",
    personalDesign: "Personal design"
  }
};

function t(locale, key) {
  return UI[locale]?.[key] || UI.en[key] || key;
}

function readGuestCart() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function syncCartCount(cart) {
  const count = (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  window.dispatchEvent(new CustomEvent("aurora:cart-updated", { detail: { count } }));
  return count;
}

function addGuestCartItem(payload) {
  const cart = readGuestCart();
  const nextCart = {
    items: [
      ...cart.items,
      {
        ...payload,
        id: `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        quantity: Number(payload.quantity || 1)
      }
    ]
  };
  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(nextCart));
  syncCartCount(nextCart);
  window.dispatchEvent(new CustomEvent("aurora:item-added"));
  return nextCart;
}

function studioLocalizedName(item, locale) {
  return locale === "en"
    ? item?.name_en || item?.label_en || item?.name || item?.code
    : item?.name_uk || item?.label_uk || item?.name || item?.code;
}

function normalizeLegacyConstructorMaterialCode(code) {
  if (code === "gold_plated") return "gold";
  if (code === "solid_gold") return "gold";
  if (code === "jewelry_steel") return "silver";
  return code || "";
}

function TypeIcon({ type }) {
  const color = "currentColor";

  if (type === "ring") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <ellipse cx="16" cy="20" rx="12" ry="5" />
        <path d="M4 20 Q4 8 16 8 Q28 8 28 20" />
      </svg>
    );
  }

  if (type === "bracelet") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <ellipse cx="16" cy="16" rx="12" ry="8" />
        <ellipse cx="16" cy="14" rx="12" ry="8" />
      </svg>
    );
  }

  if (type === "pendant") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M10 10 Q16 5 22 10 Q22 15 16 22 Q10 15 10 10" />
        <circle cx="16" cy="24" r="2.5" fill={color} opacity="0.4" />
      </svg>
    );
  }

  if (type === "earrings") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="8" r="3" />
        <line x1="10" y1="11" x2="10" y2="18" />
        <ellipse cx="10" cy="23" rx="4" ry="5" />
        <circle cx="22" cy="8" r="3" />
        <line x1="22" y1="11" x2="22" y2="18" />
        <ellipse cx="22" cy="23" rx="4" ry="5" />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="16" cy="16" r="10" />
    </svg>
  );
}

function StudioConstructorSlots({ locale, slots, stones, selections, onSelectSlot }) {
  const [activeSlotId, setActiveSlotId] = useState(null);
  const activeSlot = slots.find((slot) => String(slot.id) === String(activeSlotId)) || null;
  const activeStoneCode = activeSlot ? selections?.[activeSlot.code] || "none" : "none";
  const selectedCount = slots.filter((slot) => selections?.[slot.code] && selections?.[slot.code] !== "none").length;
  const orderedSlots = useMemo(() => {
    const preferredOrder = ["left", "center", "right"];
    const ordered = preferredOrder.map((code) => slots.find((slot) => slot.code === code)).filter(Boolean);
    const remaining = slots.filter((slot) => !preferredOrder.includes(slot.code));
    return ordered.length ? [...ordered, ...remaining] : slots;
  }, [slots]);

  return (
    <div className="stone-slots-wrap">
      <div className="stone-slots-header">
        <span className="stone-count-badge">{selectedCount}/{slots.length} {locale === "en" ? "slots" : "слотів"}</span>
      </div>
      <div className="slots-row">
        {orderedSlots.map((slot) => {
          const selectedStone = stones.find((stone) => stone.code === selections?.[slot.code]) || null;
          const hasSelection = Boolean(selectedStone && selectedStone.code !== "none");
          const isActive = String(activeSlotId) === String(slot.id);
          return (
            <div className="slot-container" key={slot.id}>
              <button
                type="button"
                className={`stone-slot stone-slot-lg${hasSelection ? " slot-filled" : " slot-empty"}${isActive ? " slot-active" : ""}`}
                onClick={() => setActiveSlotId(isActive ? null : slot.id)}
                title={locale === "en" ? slot.label_en : slot.label_uk}
              >
                {hasSelection ? (
                  <span
                    className="constructor-gem constructor-gem-lg has-image"
                    style={previewStoneStyle({ x: 50, y: 50, diameter: 100, scale_x: 1, scale_y: 1 }, selectedStone, "slot")}
                  />
                ) : (
                  <span className="slot-add-icon">+</span>
                )}
              </button>
              <span className="slot-label">{locale === "en" ? slot.label_en : slot.label_uk}</span>
              {hasSelection ? <span className="slot-stone-name">{studioLocalizedName(selectedStone, locale)}</span> : null}
            </div>
          );
        })}
      </div>
      {activeSlot ? (
        <div className="stone-picker-panel">
          <p className="stone-picker-title">
            {locale === "en" ? "Choose stone for" : "Оберіть камінь для"} <strong>{locale === "en" ? activeSlot.label_en : activeSlot.label_uk}</strong>
          </p>
          <div className="stone-picker-grid">
            {stones.map((stone) => {
              const isCurrent = stone.code === activeStoneCode;
              return (
                <button
                  type="button"
                  key={stone.id}
                  className={`stone-pick-btn${isCurrent ? " current" : ""}`}
                  onClick={() => {
                    onSelectSlot(activeSlot.code, stone.code);
                    setActiveSlotId(null);
                  }}
                >
                  <span
                    className={`stone-pick-media${stone.asset_url ? " has-image" : ""}`}
                    style={stone.asset_url ? previewStoneStyle({ x: 50, y: 50, diameter: 100, scale_x: 1, scale_y: 1 }, stone, "picker") : undefined}
                  />
                  <span className="stone-pick-meta">
                    <span className="stone-pick-name">{studioLocalizedName(stone, locale)}</span>
                    <span className="stone-pick-price">{stone.price_delta > 0 ? `+${stone.price_delta}` : stone.price_delta || 0} грн</span>
                  </span>
                  {isCurrent ? <span className="stone-pick-check"><Check aria-hidden="true" size={12} /></span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConstructorStudioPage({ locale }) {
  const [config, setConfig] = useState(null);
  const [jewelryTypeId, setJewelryTypeId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [configuration, setConfiguration] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const copy = referenceCopy(locale);

  useEffect(() => {
    let active = true;
    constructorApi.listTypes()
      .then((data) => {
        if (!active) return;
        setConfig({ types: data.types || [], variants: [], slotsByVariant: {}, stones: [], variantStoneMatrix: [] });
        setJewelryTypeId(String(data.types?.[0]?.id || ""));
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!jewelryTypeId) return undefined;
    let active = true;
    constructorApi.listVariants({ type_id: jewelryTypeId })
      .then((data) => {
        if (!active) return;
        const nextVariants = data.variants || [];
        setConfig((current) => ({
          ...(current || { types: [], slotsByVariant: {}, stones: [], variantStoneMatrix: [] }),
          variants: [
            ...(current?.variants || []).filter((variant) => String(variant.type_id) !== String(jewelryTypeId)),
            ...nextVariants
          ]
        }));
        setVariantId(String(nextVariants[0]?.id || ""));
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => {
      active = false;
    };
  }, [jewelryTypeId]);

  const types = config?.types || [];
  const variants = config?.variants || [];
  const stones = config?.stones || [];
  const matrix = config?.variantStoneMatrix || [];
  const currentType = types.find((item) => String(item.id) === String(jewelryTypeId)) || null;
  const typeVariants = variants.filter((item) => String(item.type_id) === String(jewelryTypeId));
  const currentVariant = typeVariants.find((item) => String(item.id) === String(variantId)) || typeVariants[0] || null;
  const currentSlots = currentVariant ? (config?.slotsByVariant?.[currentVariant.id] || []) : [];
  const matrixForVariant = currentVariant ? matrix.filter((item) => String(item.variant_id) === String(currentVariant.id) && item.is_enabled !== false) : [];
  const availableStones = matrixForVariant
    .map((entry) => {
      const stone = stones.find((item) => String(item.id) === String(entry.stone_id));
      return stone ? { ...stone, price_delta: entry.price_delta, is_default: entry.is_default } : null;
    })
    .filter(Boolean);
  const stonesByCode = buildStoneCodeMap(availableStones);
  const isPendantType = normalizePendantType(currentType?.code);
  const constructorChainOptions = getPendantChainOptions(locale);
  const selectedConstructorChain = resolveCustomDesignPendantChain(currentType?.code, configuration);

  useEffect(() => {
    if (!currentVariant?.id) return undefined;
    let active = true;
    constructorApi.getVariantOptions(currentVariant.id)
      .then((data) => {
        if (!active) return;
        setConfig((current) => {
          const currentMatrix = current?.variantStoneMatrix || [];
          const currentStones = current?.stones || [];
          const nextStonesById = new Map(currentStones.map((stone) => [String(stone.id), stone]));
          (data.stones || []).forEach((stone) => nextStonesById.set(String(stone.id), stone));
          return {
            ...(current || { types: [], variants: [] }),
            slotsByVariant: {
              ...(current?.slotsByVariant || {}),
              [data.variant.id]: data.slots || []
            },
            stones: [...nextStonesById.values()],
            variantStoneMatrix: [
              ...currentMatrix.filter((entry) => String(entry.variant_id) !== String(data.variant.id)),
              ...(data.variantStoneMatrix || [])
            ]
          };
        });
      })
      .catch((error) => {
        if (active) setToast(error.message);
      });
    return () => {
      active = false;
    };
  }, [currentVariant?.id]);

  useEffect(() => {
    if (!currentType) return;
    setConfiguration((current) => {
      const next = { ...current };
      if (!current.variant_id && currentVariant) next.variant_id = currentVariant.id;
      if (!current.material && currentType.materials?.[0]) next.material = currentType.materials.find((item) => item.is_default)?.code || currentType.materials[0].code;
      if (!current.size && currentType.size_options?.length) next.size = currentType.size_options.find((item) => item.is_default)?.code || currentType.size_options[0].code;
      if (!current.stone_slots) next.stone_slots = {};
      return next;
    });
    if (!variantId && currentVariant) setVariantId(String(currentVariant.id));
  }, [currentType, currentVariant, variantId]);

  useEffect(() => {
    if (!currentType || !currentVariant) return undefined;
    let active = true;
    setIsCalculating(true);
    const timer = window.setTimeout(() => {
      constructorApi.calculatePrice({
        jewelry_type_id: Number(currentType.id),
        configuration: { ...configuration, variant_id: Number(currentVariant.id) }
      })
        .then((result) => {
          if (active) setCalculation(result);
        })
        .catch((error) => {
          if (active) setToast(error.message);
        })
        .finally(() => {
          if (active) setIsCalculating(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentType, currentVariant, configuration]);

  function updateConfigurationField(key, value) {
    setConfiguration((current) => ({ ...current, [key]: value }));
  }

  function updateSlotSelection(slotCode, stoneCode) {
    setConfiguration((current) => {
      const nextSelections = { ...(current.stone_slots || {}) };
      if (!stoneCode || stoneCode === "none") {
        delete nextSelections[slotCode];
      } else {
        nextSelections[slotCode] = stoneCode;
      }
      return { ...current, stone_slots: nextSelections };
    });
  }

  async function handleAddDesign() {
    if (!currentType || !currentVariant || !calculation?.is_valid) return;
    setIsAdding(true);
    const payload = {
      item_type: "custom_design",
      jewelry_type_id: Number(currentType.id),
      configuration: { ...configuration, variant_id: Number(currentVariant.id) }
    };
    try {
      const cart = await cartApi.addItem(payload);
      syncCartCount(cart);
      window.location.href = "/cart";
    } catch (error) {
      if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
        addGuestCartItem({
          item_type: "custom_design",
          jewelry_type_id: Number(currentType.id),
          jewelry_type_code: currentType.code,
          title: calculation?.jewelry_type || currentType.name || t(locale, "personalDesign"),
          configuration: calculation?.normalized_configuration || { ...configuration, variant_id: Number(currentVariant.id) },
          unit_price: Number(calculation?.price || 0),
          quantity: 1
        });
        window.location.href = "/cart";
        return;
      }
      setToast(error.message);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      <main className="page-main">
        <div className="page-header">
          <div className="section-inner">
            <p className="eyebrow">{copy.constructorEyebrow}</p>
            <h1 className="page-title">{copy.constructorTitle}</h1>
          </div>
        </div>

        {loadError ? (
          <section className="section">
            <div className="container empty-state-react">
              <h2>{t(locale, "constructorUnavailable")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && config ? (
          <div className="section-inner constructor-wrap">
            <div className="constructor-layout">
              <div className="constructor-options">
                <div className="constructor-section">
                  <p className="constructor-label">{t(locale, "jewelryType")}</p>
                  <div className="type-grid">
                    {types.map((item) => {
                      const isActive = String(item.id) === String(jewelryTypeId);
                      return (
                        <button
                          key={item.id}
                          className={`type-btn${isActive ? " active" : ""}`}
                          type="button"
                          onClick={() => {
                            setJewelryTypeId(String(item.id));
                            setVariantId("");
                            setConfiguration({ stone_slots: {} });
                          }}
                        >
                          <TypeIcon type={item.code} />
                          <span>{studioLocalizedName(item, locale)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {typeVariants.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{locale === "en" ? "Variant" : "Варіант"}</p>
                    </div>
                    <div className="material-list">
                      {typeVariants.map((variant) => (
                        <button
                          key={variant.id}
                          className={`material-btn material-btn-shape${String(currentVariant?.id) === String(variant.id) ? " active" : ""}`}
                          type="button"
                          onClick={() => {
                            setVariantId(String(variant.id));
                            setConfiguration((current) => ({ ...current, variant_id: Number(variant.id), stone_slots: {} }));
                          }}
                        >
                          <span className="material-name">{studioLocalizedName(variant, locale)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentType?.materials?.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{locale === "en" ? "Material" : "Матеріал"}</p>
                      <span className="required-badge">{copy.required}</span>
                    </div>
                    <div className="material-list">
                      {currentType.materials.map((item) => (
                        <button
                          key={item.code}
                          className={`material-btn${configuration.material === item.code ? " active" : ""}`}
                          type="button"
                          onClick={() => updateConfigurationField("material", item.code)}
                        >
                          <span className="material-swatch" style={{ background: item.tone || "#d7d1c8" }} />
                          <span className="material-name">{studioLocalizedName(item, locale) || item.label}</span>
                          {item.price_delta ? <span className="material-price-delta">{item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentSlots.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{locale === "en" ? "Stones" : "Камінь"}</p>
                    </div>
                    <StudioConstructorSlots
                      locale={locale}
                      slots={currentSlots}
                      stones={availableStones}
                      selections={configuration.stone_slots || {}}
                      onSelectSlot={updateSlotSelection}
                    />
                  </div>
                ) : null}

                {currentType?.size_options?.length ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{locale === "en" ? "Size" : "Розмір"}</p>
                      <span className="required-badge">{copy.required}</span>
                    </div>
                    <div className="size-grid">
                      {currentType.size_options.map((item) => (
                        <button
                          key={item.code}
                          className={`size-btn${configuration.size === item.code ? " active" : ""}`}
                          type="button"
                          onClick={() => updateConfigurationField("size", item.code)}
                        >
                          <span className="size-val">{studioLocalizedName(item, locale) || item.label}</span>
                          {item.price_delta ? <span className={`size-price-delta${item.price_delta > 0 ? " pos" : " neg"}`}>{item.price_delta > 0 ? `+${item.price_delta}` : item.price_delta}</span> : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentType?.engraving?.enabled ? (
                  <div className="constructor-section">
                    <div className="constructor-section-head">
                      <p className="constructor-label">{locale === "en" ? "Engraving" : "Гравіювання"}</p>
                    </div>
                    <div className="field">
                      <input
                        type="text"
                        className="field-input"
                        value={configuration.engraving_text || ""}
                        maxLength={Number(currentType.engraving.max_length || 24)}
                        placeholder={locale === "en" ? currentType.engraving.placeholder_en : currentType.engraving.placeholder_uk}
                        onChange={(event) => updateConfigurationField("engraving_text", event.target.value)}
                      />
                      <span className="field-counter">{String(configuration.engraving_text || "").length}/{currentType.engraving.max_length || 24}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="constructor-preview-wrap">
                <div className="constructor-preview-sticky">
                  <div className="preview-stage">
                    <p className="constructor-label" style={{ marginBottom: "1.5rem", textAlign: "center" }}>{copy.constructorPreview}</p>
                    <div className="preview-canvas">
                      {currentVariant ? (
                        <JewelryPreview
                          variant={currentVariant}
                          slots={currentSlots}
                          stonesByCode={stonesByCode}
                          selections={configuration.stone_slots || {}}
                          engraving={configuration.engraving_text || ""}
                          materialCode={configuration.material || ""}
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-row">
                      <span className="summary-label">{t(locale, "currentPrice")}</span>
                      <span className="summary-price">{formatCurrency(calculation?.price ?? currentType?.base_price ?? 0, calculation?.currency || "UAH", LOCALE_FORMATS[locale])}</span>
                    </div>
                    <div className="summary-breakdown">
                      <span>{isCalculating ? t(locale, "calculating") : t(locale, "validated")}</span>
                      <span>{studioLocalizedName(currentVariant, locale) || studioLocalizedName(currentType, locale) || t(locale, "piece")}</span>
                    </div>
                    <div className="summary-breakdown">
                      <span>{locale === "en" ? "Material" : "Матеріал"}</span>
                      <span>{currentType?.materials?.find((item) => item.code === normalizeLegacyConstructorMaterialCode(configuration.material))?.label || "-"}</span>
                    </div>
                    {currentType?.size_options?.length ? (
                      <div className="summary-breakdown">
                        <span>{locale === "en" ? "Size" : "Розмір"}</span>
                        <span>{currentType?.size_options?.find((item) => item.code === configuration.size)?.label || "-"}</span>
                      </div>
                    ) : null}
                    {isPendantType ? (
                      <>
                        <div className="summary-divider" />
                        <div className="product-sizes" style={{ marginTop: "0.5rem" }}>
                          <p className="product-attr-label" style={{ marginBottom: "0.75rem" }}>{locale === "uk" ? "Комплектація" : "Configuration"}</p>
                          <p className="product-desc-text" style={{ marginBottom: "1rem" }}>{getPendantChainUpsellNote(locale)}</p>
                          <div className="size-grid">
                            {constructorChainOptions.map((option) => (
                              <button
                                key={option.code}
                                className={`size-btn${extractPendantChainOption(configuration) === option.code ? " active" : ""}`}
                                type="button"
                                onClick={() => updateConfigurationField("chainOption", option.code)}
                              >
                                <span className="size-val">{option.label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
                            <span>{getPendantChainColorNote(selectedConstructorChain?.metal, locale)}</span>
                            <span>{selectedConstructorChain?.price ? formatCurrency(selectedConstructorChain.price, "UAH", LOCALE_FORMATS[locale]) : locale === "uk" ? "0 грн" : "0 UAH"}</span>
                          </div>
                        </div>
                      </>
                    ) : null}
                    {!calculation?.is_valid ? <div className="summary-warning">{(calculation?.missing_required || []).join(", ")}</div> : null}
                    <button className="button constructor-add-btn" type="button" disabled={!calculation?.is_valid || isAdding} onClick={handleAddDesign}>
                      {isAdding ? t(locale, "adding") : t(locale, "addToCart")}
                    </button>
                    <div className="constructor-trust">
                      <span>{copy.constructorTrustLeft}</span>
                      <span>{copy.constructorTrustRight}</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </main>
      {toast ? <div className="toast-message">{toast}</div> : null}
    </>
  );
}

export default function ConstructorRoute() {
  const { locale, toggleLocale } = usePublicLocale();

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <ConstructorStudioPage locale={locale} />
        <Footer locale={locale} />
      </div>
    </>
  );
}
