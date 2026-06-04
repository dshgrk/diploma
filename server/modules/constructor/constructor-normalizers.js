// Файл нормалізує записи JSON-конструктора перед збереженням і розрахунками.
const { BUSINESS_RULES } = require("../../constants/business-rules");
const { createHttpError } = require("../../utils/http-error");
const {
  DEFAULT_DATA,
  normalizeBoolean,
  normalizeText,
  toNumber
} = require("./constructor-json.store");

// Перевіряє текстове поле і повертає очищене значення або кидає помилку валідації.
function requireText(payload, field, label = field) {
  const value = normalizeText(payload[field]);
  if (!value) {
    throw createHttpError(422, "VALIDATION_ERROR", `${label} is required`, { [field]: `${label} is required` });
  }
  return value;
}

// Обмежує координату preview в межах 0-100 відсотків.
function clampPercent(value) {
  return Math.max(0, Math.min(100, toNumber(value, 50)));
}

// Обмежує масштаб каменю або слота безпечним діапазоном.
function clampScale(value) {
  const number = toNumber(value, 1);
  return Math.max(0.1, Math.min(4, number));
}

// Обмежує діаметр каменю, щоб preview залишався керованим.
function clampDiameter(value) {
  const number = toNumber(value, 12);
  return Math.max(2, Math.min(80, number));
}

// Нормалізує кут повороту у діапазон 0-359.9 градусів.
function clampRotation(value) {
  const number = toNumber(value, 0);
  const normalized = ((number % 360) + 360) % 360;
  return Number(normalized.toFixed(1));
}

// Приводить старі та нові коди металів до єдиного формату.
function normalizeConstructorMaterialCode(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "";
  if (normalized === "silver" || normalized === "silver_925") return "silver";
  if (normalized === "gold" || normalized === "gold_plated" || normalized === "solid_gold") return "gold";
  if (normalized === "rose_gold" || normalized === "rose_gold_925" || normalized === "rose_gold_plated") return "rose_gold";
  return normalized;
}

// Нормалізує тип прикраси разом із матеріалами, розмірами та гравіюванням.
function normalizeTypeRecord(payload, current = {}) {
  return {
    id: current.id || null,
    code: requireText(payload, "code", "Type code"),
    name_uk: requireText(payload, "name_uk", "Type name uk"),
    name_en: requireText(payload, "name_en", "Type name en"),
    base_price: toNumber(payload.base_price, current.base_price || 0),
    is_active: normalizeBoolean(payload.is_active, current.is_active !== false),
    sort_order: toNumber(payload.sort_order, current.sort_order || 0),
    materials: Array.isArray(payload.materials) ? payload.materials.map((item, index) => ({
      code: requireText(item, "code", "Material code"),
      name_uk: requireText(item, "name_uk", "Material name uk"),
      name_en: requireText(item, "name_en", "Material name en"),
      price_delta: toNumber(item.price_delta, 0),
      tone: normalizeText(item.tone),
      is_active: normalizeBoolean(item.is_active, true),
      sort_order: toNumber(item.sort_order, index + 1)
    })) : (current.materials || []),
    size_options: Array.isArray(payload.size_options) ? payload.size_options.map((item, index) => ({
      code: requireText(item, "code", "Size code"),
      label_uk: requireText(item, "label_uk", "Size label uk"),
      label_en: requireText(item, "label_en", "Size label en"),
      price_delta: toNumber(item.price_delta, 0),
      is_default: normalizeBoolean(item.is_default, false),
      is_active: normalizeBoolean(item.is_active, true),
      sort_order: toNumber(item.sort_order, index + 1)
    })) : (current.size_options || []),
    engraving: payload.engraving ? {
      enabled: normalizeBoolean(payload.engraving.enabled, current.engraving?.enabled || false),
      max_length: toNumber(payload.engraving.max_length, current.engraving?.max_length || 24),
      price_delta: toNumber(payload.engraving.price_delta, current.engraving?.price_delta || BUSINESS_RULES.DEFAULT_ENGRAVING_PRICE),
      placeholder_uk: normalizeText(payload.engraving.placeholder_uk, current.engraving?.placeholder_uk || ""),
      placeholder_en: normalizeText(payload.engraving.placeholder_en, current.engraving?.placeholder_en || "")
    } : (current.engraving || DEFAULT_DATA.types.items[0].engraving)
  };
}

// Нормалізує варіант прикраси перед створенням або оновленням.
function normalizeVariantRecord(payload, current = {}) {
  return {
    id: current.id || null,
    type_id: toNumber(payload.type_id, current.type_id || 0),
    code: requireText(payload, "code", "Variant code"),
    name_uk: requireText(payload, "name_uk", "Variant name uk"),
    name_en: requireText(payload, "name_en", "Variant name en"),
    group: normalizeText(payload.group, current.group || ""),
    subtype: normalizeText(payload.subtype, current.subtype || ""),
    price_delta: toNumber(payload.price_delta, current.price_delta || 0),
    base_asset_id: payload.base_asset_id == null ? current.base_asset_id || null : toNumber(payload.base_asset_id, current.base_asset_id || 0),
    is_active: normalizeBoolean(payload.is_active, current.is_active !== false),
    sort_order: toNumber(payload.sort_order, current.sort_order || 0)
  };
}

// Нормалізує слот каменю з координатами та правилами шару preview.
function normalizeSlotRecord(payload, current = {}) {
  const layerMode = normalizeText(payload.layer_mode, current.layer_mode || "above");
  return {
    id: current.id || null,
    variant_id: toNumber(payload.variant_id, current.variant_id || 0),
    code: requireText(payload, "code", "Slot code"),
    label_uk: requireText(payload, "label_uk", "Slot label uk"),
    label_en: requireText(payload, "label_en", "Slot label en"),
    sort_order: toNumber(payload.sort_order, current.sort_order || 0),
    x: clampPercent(payload.x ?? current.x),
    y: clampPercent(payload.y ?? current.y),
    scale_x: clampScale(payload.scale_x ?? current.scale_x),
    scale_y: clampScale(payload.scale_y ?? current.scale_y),
    diameter: clampDiameter(payload.diameter ?? current.diameter),
    rotation_deg: clampRotation(payload.rotation_deg ?? current.rotation_deg),
    layer_mode: layerMode === "below" ? "below" : "above",
    is_active: normalizeBoolean(payload.is_active, current.is_active !== false)
  };
}

// Нормалізує камінь і його стандартні параметри відображення.
function normalizeStoneRecord(payload, current = {}) {
  const layerMode = normalizeText(payload.default_layer_mode, current.default_layer_mode || "above");
  return {
    id: current.id || null,
    code: requireText(payload, "code", "Stone code"),
    name_uk: requireText(payload, "name_uk", "Stone name uk"),
    name_en: requireText(payload, "name_en", "Stone name en"),
    asset_id: payload.asset_id == null || payload.asset_id === "" ? null : toNumber(payload.asset_id, current.asset_id || 0),
    default_scale_x: clampScale(payload.default_scale_x ?? current.default_scale_x),
    default_scale_y: clampScale(payload.default_scale_y ?? current.default_scale_y),
    default_layer_mode: layerMode === "below" ? "below" : "above",
    is_active: normalizeBoolean(payload.is_active, current.is_active !== false),
    sort_order: toNumber(payload.sort_order, current.sort_order || 0)
  };
}

// Нормалізує запис доступності каменю для конкретного варіанта.
function normalizeVariantStoneRecord(payload, current = {}) {
  return {
    variant_id: toNumber(payload.variant_id, current.variant_id || 0),
    stone_id: toNumber(payload.stone_id, current.stone_id || 0),
    price_delta: toNumber(payload.price_delta, current.price_delta || 0),
    is_default: normalizeBoolean(payload.is_default, current.is_default || false),
    is_enabled: normalizeBoolean(payload.is_enabled, current.is_enabled !== false),
    sort_order: toNumber(payload.sort_order, current.sort_order || 0)
  };
}

// Синхронізує default-прапорці, щоб для варіанта був тільки один активний default.
function syncDefaultFlags(entries) {
  let seenDefault = false;
  return entries.map((entry) => {
    if (!entry.is_enabled) {
      return { ...entry, is_default: false };
    }
    if (entry.is_default && !seenDefault) {
      seenDefault = true;
      return entry;
    }
    return { ...entry, is_default: false };
  });
}

// Нормалізує default-прапорці матриці каменів окремо для кожного варіанта.
function normalizeVariantStoneDefaults(entries) {
  const byVariant = new Map();
  entries.forEach((entry) => {
    const key = Number(entry.variant_id);
    if (!byVariant.has(key)) byVariant.set(key, []);
    byVariant.get(key).push(entry);
  });
  return Array.from(byVariant.values()).flatMap((items) => (
    syncDefaultFlags(items.sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0)))
  ));
}

module.exports = {
  normalizeConstructorMaterialCode,
  normalizeSlotRecord,
  normalizeStoneRecord,
  normalizeTypeRecord,
  normalizeVariantRecord,
  normalizeVariantStoneDefaults,
  normalizeVariantStoneRecord,
  requireText,
  syncDefaultFlags
};
