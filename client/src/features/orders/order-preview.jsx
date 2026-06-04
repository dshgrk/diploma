// Файл містить логіку замовлень.
import React from "react";
import { FALLBACK_PRODUCT_IMAGE, REFERENCE_IMAGES } from "../../content";
import { buildMaterialAwareBaseAssetCandidates, buildStoneCodeMap, JewelryPreview } from "../../jewelry-preview";

// Визначає потрібне значення resolve order preview data за поточним контекстом або вхідними параметрами.
export function resolveOrderPreviewData(item, constructorConfig) {
  const config = item?.configuration || {};
  const variants = constructorConfig?.variants || [];
  let variant = variants.find((entry) => String(entry.id) === String(config.variant_id)) || null;

  if (!variant && item?.jewelry_type_id) {
    const typeVariants = variants.filter((entry) => String(entry.type_id) === String(item.jewelry_type_id));
    const shapeCode = String(config.shape || "").trim().toLowerCase();
    if (shapeCode) {
      variant =
        typeVariants.find((entry) => {
          const haystack = [entry.code, entry.subtype, entry.group, entry.name_uk, entry.name_en]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(shapeCode);
        }) || null;
    }
    if (!variant) variant = typeVariants[0] || null;
  }

  const slots = variant ? constructorConfig?.slotsByVariant?.[variant.id] || [] : [];
  const selections = { ...(config.stone_slots || {}) };
  if (!Object.keys(selections).length && config.stone && slots.length) {
    const primarySlot = slots.find((slot) => /center|main|stone-1|slot-1|pendant|drop|single/i.test(String(slot.code || ""))) || slots[0];
    if (primarySlot) selections[primarySlot.code] = config.stone;
  }

  return { variant, slots, selections };
}

// Визначає статичне preview-зображення для товару або кастомної прикраси.
function resolveOrderPreviewImage(item, variant = null) {
  const config = item?.configuration || {};
  const slug = String(item?.product_slug || "").trim();

  if (item?.item_type !== "custom_design") {
    return (
      item?.thumbnail_url ||
      REFERENCE_IMAGES.productBySlug[item?.product_slug] ||
      (slug ? `/assets/products/${slug}.png` : null) ||
      FALLBACK_PRODUCT_IMAGE
    );
  }

  const savedPreview =
    config.preview_image_url ||
    config.preview_url ||
    config.image_url ||
    config.asset_url ||
    config.base_asset_url ||
    null;

  if (savedPreview) return savedPreview;

  const baseAssetCandidates = buildMaterialAwareBaseAssetCandidates(variant, config.material || "");
  return baseAssetCandidates[0] || FALLBACK_PRODUCT_IMAGE;
}

// Компонент рендерить блок cart item preview і отримує потрібні дані через props або локальний state.
export function CartItemPreview({ item, constructorConfig }) {
  if (item.item_type !== "custom_design") {
    const image = resolveOrderPreviewImage(item);
    return (
      <div className="cart-item-preview-shell cart-item-preview-ready">
        <img className="cart-ready-image" src={image} alt={item.title || ""} loading="lazy" decoding="async" />
      </div>
    );
  }

  const { variant, slots, selections } = resolveOrderPreviewData(item, constructorConfig);
  const stonesByCode = buildStoneCodeMap(constructorConfig?.stones || []);
  const previewImage = resolveOrderPreviewImage(item, variant);
  const canRenderPreview = Boolean(variant || previewImage);

  return (
    <div className="cart-item-preview-shell cart-item-preview-custom">
      {previewImage ? (
        <img className="cart-ready-image cart-custom-preview-image" src={previewImage} alt={item.title || ""} loading="lazy" decoding="async" />
      ) : null}
      {variant ? (
        <div className="cart-custom-preview-overlay" aria-hidden={previewImage ? "true" : undefined}>
          <JewelryPreview
            variant={variant}
            slots={slots}
            stonesByCode={stonesByCode}
            selections={selections}
            engraving={item.configuration?.engraving_text || ""}
            materialCode={item.configuration?.material || ""}
          />
        </div>
      ) : null}
      {!canRenderPreview ? <div className="studio-preview-empty">No preview</div> : null}
    </div>
  );
}
