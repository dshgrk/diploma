// Файл містить головну сторінку публічного конструктора та координує її стан.
import React, { useEffect, useMemo, useState } from "react";
import { cartApi, constructorApi } from "../../api";
import { referenceCopy } from "../../content";
import { buildStoneCodeMap, JewelryPreview } from "../../jewelry-preview";
import {
  extractPendantChainOption,
  getPendantChainColorNote,
  getPendantChainOptions,
  getPendantChainUpsellNote,
  normalizePendantType,
  resolveCustomDesignPendantChain
} from "../../pendant-chain";
import { normalizeEngravingText } from "../../public-form-validation";
import { formatCurrency } from "../../utils";
import { addGuestCartItem } from "../cart/guest-cart";
import { announceCartAddition, syncCartCount } from "../cart/cart-events";
import {
  constructorText,
  normalizeLegacyConstructorMaterialCode,
  studioLocalizedName
} from "./constructor-copy";
import {
  readConstructorSearchState,
  resolveConstructorTypeId,
  resolveConstructorVariantId,
  syncConstructorSearchState
} from "./constructor-url-state";
import { StudioConstructorSlots } from "./studio-constructor-slots.jsx";
import { TypeIcon } from "./type-icon.jsx";
import { LOCALE_FORMATS } from "../../routes/public-shell.jsx";

// Формує дефолтний вибір каменів для слотів поточного варіанта.
function buildDefaultStoneSelections(slots = [], stones = []) {
  const selectableStones = stones.filter((stone) => stone?.code && stone.code !== "none" && stone.asset_url);
  if (!slots.length || !selectableStones.length) return {};

  const defaultStone = selectableStones.find((stone) => stone.is_default) || selectableStones[0];
  return Object.fromEntries(slots.map((slot) => [slot.code, defaultStone.code]));
}

// Рендерить повний робочий інтерфейс конструктора і керує API-викликами.
export function ConstructorStudioPage({ locale }) {
  const initialSearchRef = React.useRef(readConstructorSearchState());
  const defaultedStoneVariantRef = React.useRef("");
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
        const nextTypes = data.types || [];
        setConfig({ types: nextTypes, variants: [], slotsByVariant: {}, stones: [], variantStoneMatrix: [] });
        setJewelryTypeId(resolveConstructorTypeId(nextTypes, initialSearchRef.current.type) || String(nextTypes[0]?.id || ""));
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
        setVariantId(resolveConstructorVariantId(nextVariants, initialSearchRef.current.variant) || String(nextVariants[0]?.id || ""));
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
  const stonesByCode = useMemo(() => buildStoneCodeMap(availableStones), [availableStones]);
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
    if (!currentVariant?.id || !currentSlots.length || !availableStones.length) return;

    const variantKey = String(currentVariant.id);
    if (defaultedStoneVariantRef.current === variantKey) return;

    setConfiguration((current) => {
      const currentSelections = current.stone_slots || {};
      const hasKnownSlotSelection = currentSlots.some((slot) => Object.prototype.hasOwnProperty.call(currentSelections, slot.code));
      if (hasKnownSlotSelection) {
        defaultedStoneVariantRef.current = variantKey;
        return current;
      }

      const defaultSelections = buildDefaultStoneSelections(currentSlots, availableStones);
      if (!Object.keys(defaultSelections).length) return current;

      defaultedStoneVariantRef.current = variantKey;
      return {
        ...current,
        variant_id: Number(currentVariant.id),
        stone_slots: defaultSelections
      };
    });
  }, [availableStones, currentSlots, currentVariant?.id]);

  useEffect(() => {
    syncConstructorSearchState(currentType, currentVariant);
  }, [currentType, currentVariant]);

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

  // Оновлює одне поле конфігурації конструктора.
  function updateConfigurationField(key, value) {
    setConfiguration((current) => ({ ...current, [key]: value }));
  }

  // Оновлює вибір каменю для конкретного слота.
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

  // Додає валідний custom design у серверний або guest-кошик.
  async function handleAddDesign() {
    if (!currentType || !currentVariant || !calculation?.is_valid) return;
    setIsAdding(true);
    const normalizedConfiguration = {
      ...configuration,
      variant_id: Number(currentVariant.id)
    };
    const normalizedEngraving = normalizeEngravingText(configuration.engraving_text);
    if (normalizedEngraving) normalizedConfiguration.engraving_text = normalizedEngraving;
    else delete normalizedConfiguration.engraving_text;
    const payload = {
      item_type: "custom_design",
      jewelry_type_id: Number(currentType.id),
      configuration: normalizedConfiguration
    };
    try {
      const cart = await cartApi.addItem(payload);
      syncCartCount(cart);
      window.location.href = "/cart";
    } catch (error) {
      if (error.status === 401 || error.message.toLowerCase().includes("auth")) {
        const guestCart = addGuestCartItem({
          item_type: "custom_design",
          jewelry_type_id: Number(currentType.id),
          jewelry_type_code: currentType.code,
          title: calculation?.jewelry_type || currentType.name || constructorText(locale, "personalDesign"),
          configuration: calculation?.normalized_configuration || normalizedConfiguration,
          unit_price: Number(calculation?.price || 0),
          quantity: 1
        });
        syncCartCount(guestCart);
        announceCartAddition({ item_type: "custom_design" });
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
              <h2>{constructorText(locale, "constructorUnavailable")}</h2>
              <p>{loadError}</p>
            </div>
          </section>
        ) : null}

        {!loadError && config ? (
          <div className="section-inner constructor-wrap">
            <div className="constructor-layout">
              <div className="constructor-options">
                <div className="constructor-section">
                  <p className="constructor-label">{constructorText(locale, "jewelryType")}</p>
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
                      <p className="constructor-label">{locale === "en" ? "Stones" : currentSlots.length > 1 ? "Камені" : "Камінь"}</p>
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
                      <span className="summary-label">{constructorText(locale, "currentPrice")}</span>
                      <span className="summary-price">{formatCurrency(calculation?.price ?? currentType?.base_price ?? 0, calculation?.currency || "UAH", LOCALE_FORMATS[locale])}</span>
                    </div>
                    <div className="summary-breakdown">
                      <span>{isCalculating ? constructorText(locale, "calculating") : constructorText(locale, "validated")}</span>
                      <span>{studioLocalizedName(currentVariant, locale) || studioLocalizedName(currentType, locale) || constructorText(locale, "piece")}</span>
                    </div>
                    <div className="summary-breakdown">
                      <span>{locale === "en" ? "Material" : "Матеріал"}</span>
                      <span>{studioLocalizedName(currentType?.materials?.find((item) => item.code === normalizeLegacyConstructorMaterialCode(configuration.material)), locale) || "-"}</span>
                    </div>
                    {currentType?.size_options?.length ? (
                      <div className="summary-breakdown">
                        <span>{locale === "en" ? "Size" : "Розмір"}</span>
                        <span>{studioLocalizedName(currentType?.size_options?.find((item) => item.code === configuration.size), locale) || "-"}</span>
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
                          {selectedConstructorChain?.option && selectedConstructorChain.option !== "none" ? (
                            <div className="summary-breakdown" style={{ marginTop: "1rem" }}>
                              <span>{getPendantChainColorNote(selectedConstructorChain?.metal, locale)}</span>
                              <span>{selectedConstructorChain?.price ? formatCurrency(selectedConstructorChain.price, "UAH", LOCALE_FORMATS[locale]) : locale === "uk" ? "0 грн" : "0 UAH"}</span>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {!calculation?.is_valid ? <div className="summary-warning">{(calculation?.missing_required || []).join(", ")}</div> : null}
                    <button className="button constructor-add-btn" type="button" disabled={!calculation?.is_valid || isAdding} onClick={handleAddDesign}>
                      {isAdding ? constructorText(locale, "adding") : constructorText(locale, "addToCart")}
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
