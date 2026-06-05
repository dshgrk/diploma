// Файл описує React-сторінку admin-products-route та її локальну UI-логіку.
import React, { useEffect, useState } from "react";
import { adminCatalogApi } from "../api";
import { AdminShell } from "../features/admin/admin-shell";
import { emptyProductForm, productToForm, readFileAsDataUrl } from "../features/admin/product-form";
import {
  ADMIN_PRODUCT_FILTERS,
  ADMIN_UI,
  adminLocalizedEntry,
  adminProductFilterLabel,
  adminProductFilterValueLabel,
  adminTypeCodeLabel
} from "../i18n/admin-copy";
import { FALLBACK_PRODUCT_IMAGE } from "../content";
import { formatCurrency } from "../utils";
import "../styles.css";
import "../styles/admin-products.css";

const ADMIN_LOCALE = "uk-UA";
const ADMIN_PRODUCT_ARCHIVED_LABEL = "Архів";
const ADMIN_PRODUCT_EDIT_LABEL = "Редагувати";
const ADMIN_PRODUCTS_EMPTY_LABEL = "У каталозі поки немає товарів.";
const ADMIN_PRODUCTS_INTRO = "Каталог для швидкого перегляду фото, категорій, цін і статусів.";
const ADMIN_PRODUCTS_CREATE_HELP = "Створюйте готові товари за шаблоном типу прикраси, без технічних полів конструктора.";
const ADMIN_PRODUCTS_GENERAL_LABEL = "Основне";
const ADMIN_PRODUCTS_FILTERS_LABEL = "Каталог і фільтри";
const ADMIN_PRODUCTS_IMAGE_LABEL = "Зображення";
const ADMIN_PRODUCTS_PUBLISHING_LABEL = "Публікація";
const ADMIN_PRODUCTS_SELECTION_LABEL = "Обраний товар";
const ADMIN_PRODUCTS_NEW_SUMMARY = "Новий готовий товар";
const ADMIN_PRODUCTS_NEW_DESCRIPTION = "Оберіть тип прикраси й заповніть тільки релевантні атрибути готового каталогу.";
const ADMIN_PRODUCTS_FILTER_HELP = "Список параметрів та значень відповідає вже існуючим готовим товарам у каталозі.";
const ADMIN_PRODUCTS_CURRENCY_LABEL = "Валюта";
const ADMIN_PRODUCTS_STATUS_LABEL = "Статус";
const ADMIN_PRODUCTS_EDITOR_READY = "Готово до публікації";
const ADMIN_PRODUCTS_EDITOR_DRAFT = "Чернетка / архів";
const ADMIN_PRODUCTS_VISIBILITY_LABEL = "Активний товар";
const ADMIN_PRODUCTS_TYPE_TEMPLATE_LABEL = "Шаблон типу";
const ADMIN_PRODUCTS_TYPE_TEMPLATE_HELP = "Після зміни типу форма автоматично очищає нерелевантні атрибути.";
const ADMIN_PRODUCTS_NO_EXTRA_FILTERS = "Без додаткових фільтрів";
const ADMIN_PRODUCTS_PUBLISHING_HELP = "Збереження не змінює логіку каталогу і працює через поточний адміністративний потік.";
const ADMIN_PRODUCTS_PRIMARY_IMAGE_LABEL = "Основне зображення";

const PRODUCT_FILTER_FIELDS_BY_TYPE = {
  Ring: ["type", "metal", "stoneType", "stoneShape", "stoneColor", "stoneSize", "ringSize", "ringType"],
  Bracelet: ["type", "metal", "stoneType", "stoneShape", "stoneColor", "stoneSize", "braceletLength"],
  Pendant: ["type", "metal", "stoneType", "stoneShape", "stoneColor", "stoneSize"],
  Earrings: ["type", "metal", "stoneType", "stoneShape", "stoneColor", "stoneSize"]
};

const TYPE_DEFAULT_BY_CODE = {
  ring: "Ring",
  bracelet: "Bracelet",
  pendant: "Pendant",
  earrings: "Earrings"
};

const FILTER_FIELD_KEYS = Object.keys(ADMIN_PRODUCT_FILTERS);

function getProductStatusLabel(product) {
  return product?.is_active ? ADMIN_UI.common.active : ADMIN_PRODUCT_ARCHIVED_LABEL;
}

function getDefaultFilterType(jewelryTypes, jewelryTypeId) {
  const jewelryType = jewelryTypes.find((item) => String(item.id) === String(jewelryTypeId));
  return TYPE_DEFAULT_BY_CODE[jewelryType?.code] || "";
}

function sanitizeFiltersForType(currentForm, nextType) {
  const visibleKeys = new Set(PRODUCT_FILTER_FIELDS_BY_TYPE[nextType] || ["type"]);
  const nextForm = { ...currentForm, type: nextType };

  FILTER_FIELD_KEYS.forEach((key) => {
    if (key !== "type" && !visibleKeys.has(key)) {
      nextForm[key] = "";
    }
  });

  return nextForm;
}

function buildEmptyReadyProductForm(jewelryTypes = []) {
  const baseForm = emptyProductForm(jewelryTypes);
  const defaultType = getDefaultFilterType(jewelryTypes, baseForm.jewelry_type_id);
  return sanitizeFiltersForType(baseForm, defaultType);
}

function buildFilterOptions(products) {
  return FILTER_FIELD_KEYS.reduce((accumulator, key) => {
    const seeded = ADMIN_PRODUCT_FILTERS[key] || [];
    const discovered = [...new Set(products.map((product) => product.filters?.[key]).filter(Boolean))];
    const extras = discovered.filter((value) => !seeded.includes(value)).sort((left, right) => left.localeCompare(right, "uk"));

    accumulator[key] = [...seeded, ...extras];
    return accumulator;
  }, {});
}

function buildFilterTags(product) {
  const filters = product?.filters || {};
  const activeType = filters.type || "";
  const visibleKeys = PRODUCT_FILTER_FIELDS_BY_TYPE[activeType] || [];

  return visibleKeys
    .filter((key) => key !== "type" && filters[key])
    .slice(0, 3)
    .map((key) => ({
      key,
      label: adminProductFilterValueLabel(key, filters[key])
    }));
}

function buildEditorSummary(selectedProduct, form, jewelryTypes) {
  if (!selectedProduct) {
    const typeLabel = adminProductFilterValueLabel("type", form.type || getDefaultFilterType(jewelryTypes, form.jewelry_type_id));
    return {
      title: ADMIN_PRODUCTS_NEW_SUMMARY,
      description: typeLabel ? `${ADMIN_PRODUCTS_NEW_DESCRIPTION} Тип: ${typeLabel}.` : ADMIN_PRODUCTS_NEW_DESCRIPTION,
      status: form.is_active ? ADMIN_PRODUCTS_EDITOR_READY : ADMIN_PRODUCTS_EDITOR_DRAFT
    };
  }

  const title = adminLocalizedEntry(selectedProduct.name_uk, selectedProduct.name_en, selectedProduct.slug || "Товар");
  const description = `${adminLocalizedEntry(
    selectedProduct.jewelry_type_name_uk,
    selectedProduct.jewelry_type_name_en,
    adminTypeCodeLabel(selectedProduct.jewelry_type_code)
  )} • ${selectedProduct.sku || selectedProduct.slug || "Без SKU"}`;

  return {
    title,
    description,
    status: form.is_active ? ADMIN_PRODUCTS_EDITOR_READY : ADMIN_PRODUCTS_EDITOR_DRAFT
  };
}

export default function AdminProductsRoute() {
  const [products, setProducts] = useState([]);
  const [jewelryTypes, setJewelryTypes] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("new");
  const [form, setForm] = useState(emptyProductForm());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([adminCatalogApi.listProducts(), adminCatalogApi.listJewelryTypes()])
      .then(([items, types]) => {
        if (!active) return;
        setProducts(items || []);
        setJewelryTypes(types || []);
        setForm(buildEmptyReadyProductForm(types || []));
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedProductId === "new") {
      setForm(buildEmptyReadyProductForm(jewelryTypes));
      return;
    }

    const selectedProduct = products.find((item) => String(item.id) === String(selectedProductId));
    if (selectedProduct) {
      setForm(productToForm(selectedProduct));
    }
  }, [selectedProductId, products, jewelryTypes]);

  function updateField(key, value) {
    setForm((current) => {
      if (key === "jewelry_type_id") {
        const nextType = getDefaultFilterType(jewelryTypes, value) || current.type;
        return sanitizeFiltersForType({ ...current, jewelry_type_id: value }, nextType);
      }

      if (key === "type") {
        return sanitizeFiltersForType(current, value);
      }

      return { ...current, [key]: value };
    });
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await adminCatalogApi.uploadProductImage({ file_name: file.name, data_url: dataUrl });
      setForm((current) => ({ ...current, image_asset_path: uploaded.asset_path }));
      setNotice(ADMIN_UI.products.imageUploaded);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function refreshProducts(nextSelectedId) {
    const items = await adminCatalogApi.listProducts();
    setProducts(items || []);
    if (nextSelectedId) {
      setSelectedProductId(String(nextSelectedId));
    }
  }

  async function handleSaveProduct() {
    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        jewelry_type_id: Number(form.jewelry_type_id),
        price: Number(form.price || 0),
        asset_id: form.asset_id ? Number(form.asset_id) : null,
        variant_id: form.variant_id ? Number(form.variant_id) : null
      };

      const saved = selectedProductId === "new"
        ? await adminCatalogApi.createProduct(payload)
        : await adminCatalogApi.updateProduct(selectedProductId, payload);

      await refreshProducts(saved.id);
      setNotice(selectedProductId === "new" ? ADMIN_UI.products.created : ADMIN_UI.products.updated);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate() {
    if (selectedProductId === "new") return;

    setIsSaving(true);
    setError("");

    try {
      await adminCatalogApi.deactivateProduct(selectedProductId);
      await refreshProducts(selectedProductId);
      setNotice(ADMIN_UI.products.archived);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const selectedProduct = products.find((item) => String(item.id) === String(selectedProductId)) || null;
  const activeProductsCount = products.filter((product) => product.is_active).length;
  const resolvedFilterType = form.type || getDefaultFilterType(jewelryTypes, form.jewelry_type_id);
  const visibleFilterKeys = PRODUCT_FILTER_FIELDS_BY_TYPE[resolvedFilterType] || ["type"];
  const filterOptions = buildFilterOptions(products);
  const editorSummary = buildEditorSummary(selectedProduct, form, jewelryTypes);

  return (
    <AdminShell title={ADMIN_UI.products.title} subtitle={ADMIN_UI.products.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}

      <div className="admin-products-page">
        <section className="admin-panel admin-products-catalog-panel">
          <div className="admin-panel-head admin-products-panel-head">
            <div className="admin-products-heading">
              <h2>{ADMIN_UI.products.listTitle}</h2>
              <p>{ADMIN_PRODUCTS_INTRO}</p>
            </div>

            <div className="admin-inline-actions admin-products-panel-actions">
              <div className="admin-products-summary" aria-label="Підсумок каталогу">
                <span>{products.length} позицій</span>
                <span>{activeProductsCount} активних</span>
              </div>
              <button type="button" className="small-button" onClick={() => setSelectedProductId("new")}>
                {ADMIN_UI.products.new}
              </button>
            </div>
          </div>

          <div className="admin-products-collection" role="list" aria-label="Готові товари">
            {products.length === 0 ? (
              <div className="admin-products-empty-state">{ADMIN_PRODUCTS_EMPTY_LABEL}</div>
            ) : products.map((product) => {
              const isSelected = String(selectedProductId) === String(product.id);
              const productName = adminLocalizedEntry(product.name_uk, product.name_en, "Без назви");
              const productType = adminLocalizedEntry(
                product.jewelry_type_name_uk,
                product.jewelry_type_name_en,
                adminTypeCodeLabel(product.jewelry_type_code)
              );
              const filterTags = buildFilterTags(product);

              return (
                <article
                  key={product.id}
                  role="listitem"
                  className={`admin-products-card${isSelected ? " is-selected" : ""}`}
                  onClick={() => setSelectedProductId(String(product.id))}
                >
                  <div className="admin-products-card-media">
                    <img
                      src={product.image?.asset_path || FALLBACK_PRODUCT_IMAGE}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="admin-products-card-body">
                    <div className="admin-products-card-topline">
                      <span className={`admin-products-status${product.is_active ? " is-active" : ""}`}>
                        {getProductStatusLabel(product)}
                      </span>
                      <span className="admin-products-card-code">{product.sku || product.slug || "Без SKU"}</span>
                    </div>

                    <div className="admin-products-card-heading">
                      <strong>{productName}</strong>
                      <span>{productType}</span>
                    </div>

                    <div className="admin-products-card-price">
                      {formatCurrency(Number(product.price || 0), product.currency || "UAH", ADMIN_LOCALE)}
                    </div>

                    <div className="admin-products-card-tags" aria-label="Фільтри товару">
                      {filterTags.length > 0 ? filterTags.map((tag) => (
                        <span key={tag.key}>{tag.label}</span>
                      )) : <span>{ADMIN_PRODUCTS_NO_EXTRA_FILTERS}</span>}
                    </div>

                    <div className="admin-products-card-footer">
                      <span className="admin-products-card-slug">{product.slug || "—"}</span>
                      <button
                        type="button"
                        className={`small-button${isSelected ? " is-active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedProductId(String(product.id));
                        }}
                      >
                        {ADMIN_PRODUCT_EDIT_LABEL}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="admin-panel admin-products-editor-panel">
          <div className="admin-products-editor-sticky">
            <div className="admin-panel-head admin-products-panel-head">
              <div className="admin-products-heading">
                <h2>{selectedProductId === "new" ? ADMIN_UI.products.create : ADMIN_UI.products.edit}</h2>
                <p>{ADMIN_PRODUCTS_CREATE_HELP}</p>
              </div>

              <div className="admin-inline-actions">
                {selectedProductId !== "new" ? (
                  <button type="button" className="small-button button-danger" disabled={isSaving} onClick={handleDeactivate}>
                    {ADMIN_UI.common.archive}
                  </button>
                ) : null}
                <button type="button" className="small-button" disabled={isSaving} onClick={handleSaveProduct}>
                  {isSaving ? ADMIN_UI.common.saving : ADMIN_UI.common.save}
                </button>
              </div>
            </div>

            <div className="admin-products-editor-summary">
              <div>
                <span>{ADMIN_PRODUCTS_SELECTION_LABEL}</span>
                <strong>{editorSummary.title}</strong>
                <p>{editorSummary.description}</p>
              </div>
              <span className={`admin-products-status${form.is_active ? " is-active" : ""}`}>{editorSummary.status}</span>
            </div>

            <div className="admin-products-editor-sections">
              <section className="admin-subsection admin-products-section">
                <div className="admin-products-section-head">
                  <div>
                    <h3>{ADMIN_PRODUCTS_GENERAL_LABEL}</h3>
                    {selectedProductId === "new" ? <p>{ADMIN_PRODUCTS_TYPE_TEMPLATE_HELP}</p> : null}
                  </div>
                </div>

                <div className="admin-form-grid">
                  <label>
                    <span>{ADMIN_PRODUCTS_TYPE_TEMPLATE_LABEL}</span>
                    <select value={form.jewelry_type_id} onChange={(event) => updateField("jewelry_type_id", event.target.value)}>
                      {jewelryTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {adminLocalizedEntry(type.name_uk, type.name_en, adminTypeCodeLabel(type.code))}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>{adminProductFilterLabel("type")}</span>
                    <select value={resolvedFilterType} onChange={(event) => updateField("type", event.target.value)}>
                      {filterOptions.type.map((value) => (
                        <option key={value} value={value}>
                          {adminProductFilterValueLabel("type", value)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>SKU</span>
                    <input value={form.sku} onChange={(event) => updateField("sku", event.target.value)} />
                  </label>

                  <label>
                    <span>{ADMIN_UI.products.slug}</span>
                    <input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} />
                  </label>

                  <label>
                    <span>{ADMIN_UI.products.price}</span>
                    <input type="number" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
                  </label>

                  <label>
                    <span>{ADMIN_PRODUCTS_CURRENCY_LABEL}</span>
                    <input value={form.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} maxLength={3} />
                  </label>

                  <label className="admin-toggle admin-products-visibility-toggle">
                    <input type="checkbox" checked={form.is_active} onChange={(event) => updateField("is_active", event.target.checked)} />
                    <span>{ADMIN_PRODUCTS_VISIBILITY_LABEL}</span>
                  </label>

                  <label>
                    <span>{ADMIN_UI.products.nameUk}</span>
                    <input value={form.name_uk} onChange={(event) => updateField("name_uk", event.target.value)} />
                  </label>

                  <label>
                    <span>{ADMIN_UI.products.nameEn}</span>
                    <input value={form.name_en} onChange={(event) => updateField("name_en", event.target.value)} />
                  </label>

                  <label className="full">
                    <span>{ADMIN_UI.products.descriptionUk}</span>
                    <textarea rows={4} value={form.description_uk} onChange={(event) => updateField("description_uk", event.target.value)} />
                  </label>

                  <label className="full">
                    <span>{ADMIN_UI.products.descriptionEn}</span>
                    <textarea rows={4} value={form.description_en} onChange={(event) => updateField("description_en", event.target.value)} />
                  </label>
                </div>
              </section>

              <section className="admin-subsection admin-products-section">
                <div className="admin-products-section-head">
                  <div>
                    <h3>{ADMIN_PRODUCTS_FILTERS_LABEL}</h3>
                    <p>{ADMIN_PRODUCTS_FILTER_HELP}</p>
                  </div>
                </div>

                <div className="admin-form-grid compact">
                  {visibleFilterKeys.filter((key) => key !== "type").map((key) => (
                    <label key={key}>
                      <span>{adminProductFilterLabel(key)}</span>
                      <select value={form[key] || ""} onChange={(event) => updateField(key, event.target.value)}>
                        <option value="">-</option>
                        {(filterOptions[key] || []).map((value) => (
                          <option key={value} value={value}>
                            {adminProductFilterValueLabel(key, value)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </section>

              <section className="admin-subsection admin-products-section">
                <div className="admin-products-section-head">
                  <h3>{ADMIN_PRODUCTS_IMAGE_LABEL}</h3>
                </div>

                <div className="admin-products-image-section">
                  <div className="admin-products-image-preview">
                    <img
                      src={form.image_asset_path || FALLBACK_PRODUCT_IMAGE}
                      alt={form.name_uk || form.name_en || ADMIN_UI.common.preview}
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <strong>{form.name_uk || form.name_en || ADMIN_UI.products.previewName}</strong>
                      <span>{formatCurrency(Number(form.price || 0), form.currency || "UAH", ADMIN_LOCALE)}</span>
                    </div>
                  </div>

                  <div className="admin-form-grid compact admin-products-image-fields">
                    <label className="full">
                      <span>{ADMIN_PRODUCTS_PRIMARY_IMAGE_LABEL}</span>
                      <input value={form.image_asset_path} onChange={(event) => updateField("image_asset_path", event.target.value)} />
                    </label>

                    <label>
                      <span>{ADMIN_UI.products.imageAltUk}</span>
                      <input value={form.image_alt_uk} onChange={(event) => updateField("image_alt_uk", event.target.value)} />
                    </label>

                    <label>
                      <span>{ADMIN_UI.products.imageAltEn}</span>
                      <input value={form.image_alt_en} onChange={(event) => updateField("image_alt_en", event.target.value)} />
                    </label>

                    <label className="admin-upload-field full">
                      <span>{ADMIN_UI.products.uploadImage}</span>
                      <input type="file" accept="image/png,image/jpeg" disabled={isUploading} onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              </section>

              <section className="admin-subsection admin-products-section">
                <div className="admin-products-section-head">
                  <h3>{ADMIN_PRODUCTS_PUBLISHING_LABEL}</h3>
                </div>

                <div className="admin-products-publishing-grid">
                  <div className="admin-products-publishing-card">
                    <span>{ADMIN_PRODUCTS_STATUS_LABEL}</span>
                    <strong>{form.is_active ? ADMIN_PRODUCTS_EDITOR_READY : ADMIN_PRODUCTS_EDITOR_DRAFT}</strong>
                    <p>{ADMIN_PRODUCTS_PUBLISHING_HELP}</p>
                  </div>

                  <div className="admin-products-publishing-actions">
                    {selectedProductId !== "new" ? (
                      <button type="button" className="small-button button-danger" disabled={isSaving} onClick={handleDeactivate}>
                        {ADMIN_UI.common.archive}
                      </button>
                    ) : null}

                    <button type="button" className="small-button" disabled={isSaving} onClick={handleSaveProduct}>
                      {isSaving ? ADMIN_UI.common.saving : ADMIN_UI.common.save}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
