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

const ADMIN_LOCALE = "uk-UA";

export default function AdminProductsRoute() {
  const [products, setProducts] = useState([]);
  const [jewelryTypes, setJewelryTypes] = useState([]);
  const [constructorConfig, setConstructorConfig] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("new");
  const [form, setForm] = useState(emptyProductForm());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminCatalogApi.listProducts(),
      adminCatalogApi.listJewelryTypes(),
      adminCatalogApi.getConstructorConfig(),
      adminCatalogApi.listAssets()
    ])
      .then(([items, types, constructorData, assetItems]) => {
        if (!active) return;
        setProducts(items || []);
        setJewelryTypes(types || []);
        setConstructorConfig(constructorData || null);
        setAssets(assetItems || []);
        setForm(emptyProductForm(types || []));
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
      setForm(emptyProductForm(jewelryTypes));
      return;
    }
    const selectedProduct = products.find((item) => String(item.id) === String(selectedProductId));
    if (selectedProduct) setForm(productToForm(selectedProduct));
  }, [selectedProductId, products, jewelryTypes]);

  function updateField(key, value) {
    setForm((current) => {
      if (key === "asset_id") {
        const asset = assets.find((item) => String(item.id) === String(value));
        return { ...current, asset_id: value, image_asset_path: asset?.path || current.image_asset_path };
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

  const availableVariants = (constructorConfig?.variants || []).filter((variant) => {
    if (!form.jewelry_type_id) return true;
    return String(variant.type_id) === String(form.jewelry_type_id);
  });
  const imageAssets = assets.filter((asset) => asset.kind === "product" || asset.kind === "jewelry-base" || asset.kind === "other");

  return (
    <AdminShell title={ADMIN_UI.products.title} subtitle={ADMIN_UI.products.subtitle}>
      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-success">{notice}</p> : null}
      <div className="admin-editor-grid">
        <aside className="admin-panel admin-sidebar">
          <div className="admin-panel-head">
            <h2>{ADMIN_UI.products.listTitle}</h2>
            <button type="button" className="small-button" onClick={() => setSelectedProductId("new")}>{ADMIN_UI.common.new}</button>
          </div>
          <div className="admin-list-stack">
            {products.map((product) => (
              <button
                type="button"
                key={product.id}
                className={`admin-select-row${String(selectedProductId) === String(product.id) ? " is-active" : ""}`}
                onClick={() => setSelectedProductId(String(product.id))}
              >
                <img src={product.image?.asset_path || FALLBACK_PRODUCT_IMAGE} alt="" loading="lazy" decoding="async" />
                <div>
                  <strong>{adminLocalizedEntry(product.name_uk, product.name_en)}</strong>
                  <span>{adminLocalizedEntry(product.jewelry_type_name_uk, product.jewelry_type_name_en, adminTypeCodeLabel(product.jewelry_type_code))}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-panel wide">
          <div className="admin-panel-head">
            <h2>{selectedProductId === "new" ? ADMIN_UI.products.create : ADMIN_UI.products.edit}</h2>
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

          <div className="admin-form-grid">
            <label>
              <span>{ADMIN_UI.products.jewelryType}</span>
              <select value={form.jewelry_type_id} onChange={(event) => updateField("jewelry_type_id", event.target.value)}>
                {jewelryTypes.map((type) => (
                  <option key={type.id} value={type.id}>{adminLocalizedEntry(type.name_uk, type.name_en, adminTypeCodeLabel(type.code))}</option>
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
            <label className="full">
              <span>{ADMIN_UI.products.primaryImageAsset}</span>
              <input value={form.image_asset_path} onChange={(event) => updateField("image_asset_path", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.linkedVariant}</span>
              <select value={form.variant_id} onChange={(event) => updateField("variant_id", event.target.value)}>
                <option value="">-</option>
                {availableVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>{adminLocalizedEntry(variant.name_uk, variant.name_en, variant.code)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{ADMIN_UI.products.assetLibrary}</span>
              <select value={form.asset_id} onChange={(event) => updateField("asset_id", event.target.value)}>
                <option value="">-</option>
                {imageAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{ADMIN_UI.products.imageAltUk}</span>
              <input value={form.image_alt_uk} onChange={(event) => updateField("image_alt_uk", event.target.value)} />
            </label>
            <label>
              <span>{ADMIN_UI.products.imageAltEn}</span>
              <input value={form.image_alt_en} onChange={(event) => updateField("image_alt_en", event.target.value)} />
            </label>
            <label className="admin-upload-field">
              <span>{ADMIN_UI.products.uploadImage}</span>
              <input type="file" accept="image/png,image/jpeg" disabled={isUploading} onChange={handleImageUpload} />
            </label>
            <label className="admin-toggle">
              <input type="checkbox" checked={form.is_active} onChange={(event) => updateField("is_active", event.target.checked)} />
              <span>{ADMIN_UI.common.active}</span>
            </label>
          </div>

          <div className="admin-subsection">
            <h3>{ADMIN_UI.products.catalogFilters}</h3>
            <div className="admin-form-grid compact">
              {Object.entries(ADMIN_PRODUCT_FILTERS).map(([key, values]) => (
                <label key={key}>
                  <span>{adminProductFilterLabel(key)}</span>
                  <select value={form[key] || ""} onChange={(event) => updateField(key, event.target.value)}>
                    <option value="">-</option>
                    {values.map((value) => (
                      <option key={value} value={value}>{adminProductFilterValueLabel(key, value)}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-product-preview">
            <img src={form.image_asset_path || FALLBACK_PRODUCT_IMAGE} alt={form.name_uk || form.name_en || ADMIN_UI.common.preview} loading="lazy" decoding="async" />
            <div>
              <strong>{form.name_uk || form.name_en || ADMIN_UI.products.previewName}</strong>
              <span>{formatCurrency(Number(form.price || 0), form.currency || "UAH", ADMIN_LOCALE)}</span>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
