const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { createHttpError } = require("../../utils/http-error");
const { resolveLocale } = require("../../utils/locale");
const { BUSINESS_RULES } = require("../../constants/business-rules");
const { resolveCustomDesignChainConfiguration } = require("../../utils/pendant-chain");
const {
  FILES,
  DEFAULT_DATA,
  buildPublicConfig,
  nextNumericId,
  normalizeBoolean,
  normalizeText,
  readStudioData,
  resolveImageMetadata,
  sortByOrder,
  toNumber,
  writeFileJson
} = require("./constructor-json.store");

const ALLOWED_ASSET_KINDS = new Set(["jewelry-base", "stone", "product", "other"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function requireText(payload, field, label = field) {
  const value = normalizeText(payload[field]);
  if (!value) {
    throw createHttpError(422, "VALIDATION_ERROR", `${label} is required`, { [field]: `${label} is required` });
  }
  return value;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, toNumber(value, 50)));
}

function clampScale(value) {
  const number = toNumber(value, 1);
  return Math.max(0.1, Math.min(4, number));
}

function clampDiameter(value) {
  const number = toNumber(value, 12);
  return Math.max(2, Math.min(80, number));
}

function clampRotation(value) {
  const number = toNumber(value, 0);
  const normalized = ((number % 360) + 360) % 360;
  return Number(normalized.toFixed(1));
}

function normalizeConstructorMaterialCode(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "";
  if (normalized === "silver" || normalized === "silver_925") return "silver";
  if (normalized === "gold" || normalized === "gold_plated" || normalized === "solid_gold") return "gold";
  if (normalized === "rose_gold" || normalized === "rose_gold_925" || normalized === "rose_gold_plated") return "rose_gold";
  return normalized;
}

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

async function persistStudioParts(studio, keys) {
  await Promise.all(keys.map((key) => writeFileJson(FILES[key], studio[key])));
}

async function listAdminConstructorConfig() {
  const studio = await readStudioData();
  return {
    types: sortByOrder(studio.types.items),
    variants: sortByOrder(studio.variants.items),
    slots: sortByOrder(studio.variants.slots),
    stones: sortByOrder(studio.stones.items),
    variant_stones: sortByOrder(studio.variants.variant_stones),
    assets: sortByOrder(studio.assets.items),
    product_meta: studio.productMeta.items
  };
}

async function getPublicConstructorConfig(req) {
  const studio = await readStudioData();
  return buildPublicConfig(studio, resolveLocale(req));
}

function getVariantContext(studio, jewelryTypeId, variantId) {
  const type = studio.types.items.find((item) => Number(item.id) === Number(jewelryTypeId) && item.is_active !== false);
  if (!type) throw createHttpError(404, "JEWELRY_TYPE_NOT_FOUND", "Jewelry type not found");
  const variant = studio.variants.items.find((item) => Number(item.id) === Number(variantId) && Number(item.type_id) === Number(type.id) && item.is_active !== false);
  if (!variant) throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");
  return { type, variant };
}

function buildPreviewLayersFromVariant(studio, variant, stoneSelections, engravingText) {
  const assetsById = Object.fromEntries(studio.assets.items.map((asset) => [asset.id, asset]));
  const stonesById = Object.fromEntries(studio.stones.items.map((stone) => [stone.id, stone]));
  const matrixEntries = studio.variants.variant_stones.filter((item) => Number(item.variant_id) === Number(variant.id) && item.is_enabled !== false);
  const slots = studio.variants.slots.filter((slot) => Number(slot.variant_id) === Number(variant.id) && slot.is_active !== false);
  const matrixByStoneId = Object.fromEntries(matrixEntries.map((item) => [item.stone_id, item]));
  const stoneByCode = Object.fromEntries(studio.stones.items.map((item) => [item.code, item]));
  const baseAsset = assetsById[variant.base_asset_id] || null;
  const layers = [];

  if (baseAsset && baseAsset.path) {
    layers.push({ layer_key: "base", asset_url: baseAsset.path, z_index: 2 });
  }

  slots.forEach((slot) => {
    const stoneCode = stoneSelections?.[slot.code];
    if (!stoneCode) return;
    const stone = stoneByCode[stoneCode];
    if (!stone || stone.code === "none") return;
    if (!matrixByStoneId[stone.id]) return;
    const asset = assetsById[stone.asset_id];
    if (!asset?.path) return;
    const zIndex = slot.layer_mode === "below" ? 1 : 3;
    layers.push({
      layer_key: "stone",
      asset_url: asset.path,
      z_index: zIndex,
      transform_meta: {
        slot_code: slot.code,
        x: slot.x,
        y: slot.y,
        diameter: slot.diameter,
        scale_x: Number(slot.scale_x || 1) * Number(stone.default_scale_x || 1),
        scale_y: Number(slot.scale_y || 1) * Number(stone.default_scale_y || 1),
        layer_mode: slot.layer_mode
      }
    });
  });

  if (normalizeText(engravingText)) {
    layers.push({ layer_key: "engraving", asset_url: null, z_index: 4, text_placeholder: normalizeText(engravingText) });
  }

  return layers.sort((left, right) => left.z_index - right.z_index);
}

async function calculateStudioPrice({ jewelryTypeId, configuration = {}, req = null }) {
  const studio = await readStudioData();
  const locale = req ? resolveLocale(req) : "uk";
  const { type, variant } = getVariantContext(studio, jewelryTypeId, configuration.variant_id);
  const missingRequired = [];
  const slots = sortByOrder(studio.variants.slots.filter((slot) => Number(slot.variant_id) === Number(variant.id) && slot.is_active !== false));
  const allowedSlotCodes = slots.map((slot) => slot.code);
  const slotSelections = configuration.stone_slots && typeof configuration.stone_slots === "object" ? configuration.stone_slots : {};
  const selectedSlotEntries = Object.entries(slotSelections).filter(([, value]) => normalizeText(value));
  const invalidSlotIds = selectedSlotEntries.map(([slotCode]) => slotCode).filter((slotCode) => !allowedSlotCodes.includes(slotCode));

  if (invalidSlotIds.length) {
    throw createHttpError(422, "INVALID_CONFIGURATION_VALUE", "Invalid slot id for stone selection", {
      invalid_slots: invalidSlotIds
    });
  }

  const materials = (type.materials || []).filter((item) => item.is_active !== false);
  const sizes = (type.size_options || []).filter((item) => item.is_active !== false);
  const requestedMaterialCode = normalizeConstructorMaterialCode(configuration.material);
  const selectedMaterial = materials.find((item) => item.code === requestedMaterialCode);
  if (!selectedMaterial) missingRequired.push("material");
  const selectedSize = sizes.length ? sizes.find((item) => item.code === configuration.size) : null;
  if (sizes.length && !selectedSize) missingRequired.push("size");

  const matrix = studio.variants.variant_stones.filter((item) => Number(item.variant_id) === Number(variant.id) && item.is_enabled !== false);
  const stonesById = Object.fromEntries(studio.stones.items.map((stone) => [stone.id, stone]));
  const matrixByStoneCode = Object.fromEntries(matrix.map((entry) => [stonesById[entry.stone_id]?.code, entry]));

  let calculatedPrice = Number(type.base_price || 0);
  calculatedPrice += Number(variant.price_delta || 0);
  if (selectedMaterial) calculatedPrice += Number(selectedMaterial.price_delta || 0);
  if (selectedSize) calculatedPrice += Number(selectedSize.price_delta || 0);

  for (const [, stoneCode] of selectedSlotEntries) {
    const entry = matrixByStoneCode[stoneCode];
    if (!entry) {
      throw createHttpError(422, "INVALID_CONFIGURATION_VALUE", "Stone is not available for this variant", {
        stone: stoneCode,
        variant_id: variant.id
      });
    }
    if (stoneCode !== "none") calculatedPrice += Number(entry.price_delta || 0);
  }

  const engravingText = normalizeText(configuration.engraving_text);
  if (type.engraving?.enabled && engravingText) {
    const maxLength = Number(type.engraving.max_length || 24);
    if (engravingText.length > maxLength) {
      throw createHttpError(422, "INVALID_CONFIGURATION_VALUE", "Engraving is too long", { max_length: maxLength });
    }
    calculatedPrice += Number(type.engraving.price_delta || 0);
  }

  const chain = resolveCustomDesignChainConfiguration(type, configuration);
  if (chain?.price) {
    calculatedPrice += Number(chain.price || 0);
  }

  const normalizedConfiguration = {
    ...configuration,
    variant_id: Number(variant.id)
  };

  if (selectedMaterial) {
    normalizedConfiguration.material = selectedMaterial.code;
  }

  if (selectedSize) {
    normalizedConfiguration.size = selectedSize.code;
  } else {
    delete normalizedConfiguration.size;
  }

  if (engravingText) {
    normalizedConfiguration.engraving_text = engravingText;
  } else {
    delete normalizedConfiguration.engraving_text;
  }

  delete normalizedConfiguration.chainOption;
  delete normalizedConfiguration.chain_option;

  if (chain) {
    normalizedConfiguration.chain = chain;
  } else {
    delete normalizedConfiguration.chain;
  }

  return {
    is_valid: missingRequired.length === 0,
    missing_required: missingRequired,
    price: Number(calculatedPrice.toFixed(2)),
    currency: BUSINESS_RULES.CURRENCY,
    jewelry_type: locale === "en" ? type.name_en : type.name_uk,
    variant_name: locale === "en" ? variant.name_en : variant.name_uk,
    preview_layers: buildPreviewLayersFromVariant(studio, variant, slotSelections, engravingText),
    chain,
    normalized_configuration: normalizedConfiguration
  };
}

async function createType(payload) {
  const studio = await readStudioData();
  const record = normalizeTypeRecord(payload);
  if (studio.types.items.some((item) => item.code === record.code)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Type code must be unique", { code: "Type code must be unique" });
  }
  record.id = nextNumericId(studio.types.items);
  studio.types.items.push(record);
  await writeFileJson(FILES.types, studio.types);
  return record;
}

async function updateType(typeId, payload) {
  const studio = await readStudioData();
  const index = studio.types.items.findIndex((item) => Number(item.id) === Number(typeId));
  if (index === -1) throw createHttpError(404, "TYPE_NOT_FOUND", "Type not found");
  const current = studio.types.items[index];
  const next = normalizeTypeRecord(payload, current);
  next.id = current.id;
  studio.types.items[index] = next;
  await writeFileJson(FILES.types, studio.types);
  return next;
}

async function deleteType(typeId) {
  const studio = await readStudioData();
  const typeIndex = studio.types.items.findIndex((item) => Number(item.id) === Number(typeId));
  if (typeIndex === -1) throw createHttpError(404, "TYPE_NOT_FOUND", "Type not found");

  const variantIds = studio.variants.items
    .filter((item) => Number(item.type_id) === Number(typeId))
    .map((item) => Number(item.id));

  studio.types.items.splice(typeIndex, 1);
  studio.variants.items = studio.variants.items.filter((item) => Number(item.type_id) !== Number(typeId));
  studio.variants.slots = studio.variants.slots.filter((item) => !variantIds.includes(Number(item.variant_id)));
  studio.variants.variant_stones = studio.variants.variant_stones.filter((item) => !variantIds.includes(Number(item.variant_id)));
  studio.productMeta.items = studio.productMeta.items.map((item) => (
    variantIds.includes(Number(item.variant_id)) ? { ...item, variant_id: null } : item
  ));

  await persistStudioParts(studio, ["types", "variants", "productMeta"]);
  return { deleted: true, type_id: Number(typeId), variant_ids: variantIds };
}

async function createVariant(payload) {
  const studio = await readStudioData();
  const record = normalizeVariantRecord(payload);
  if (!studio.types.items.some((item) => Number(item.id) === Number(record.type_id))) {
    throw createHttpError(422, "VALIDATION_ERROR", "Variant type does not exist", { type_id: "Variant type does not exist" });
  }
  record.id = nextNumericId(studio.variants.items);
  studio.variants.items.push(record);
  await writeFileJson(FILES.variants, studio.variants);
  return record;
}

async function updateVariant(variantId, payload) {
  const studio = await readStudioData();
  const index = studio.variants.items.findIndex((item) => Number(item.id) === Number(variantId));
  if (index === -1) throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");
  const current = studio.variants.items[index];
  const next = normalizeVariantRecord(payload, current);
  next.id = current.id;
  studio.variants.items[index] = next;
  await writeFileJson(FILES.variants, studio.variants);
  return next;
}

async function deleteVariant(variantId) {
  const studio = await readStudioData();
  const variantIndex = studio.variants.items.findIndex((item) => Number(item.id) === Number(variantId));
  if (variantIndex === -1) throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");

  studio.variants.items.splice(variantIndex, 1);
  studio.variants.slots = studio.variants.slots.filter((item) => Number(item.variant_id) !== Number(variantId));
  studio.variants.variant_stones = studio.variants.variant_stones.filter((item) => Number(item.variant_id) !== Number(variantId));
  studio.productMeta.items = studio.productMeta.items.map((item) => (
    Number(item.variant_id) === Number(variantId) ? { ...item, variant_id: null } : item
  ));

  await persistStudioParts(studio, ["variants", "productMeta"]);
  return { deleted: true, variant_id: Number(variantId) };
}

async function createSlot(payload) {
  const studio = await readStudioData();
  const record = normalizeSlotRecord(payload);
  if (!studio.variants.items.some((item) => Number(item.id) === Number(record.variant_id))) {
    throw createHttpError(422, "VALIDATION_ERROR", "Variant does not exist", { variant_id: "Variant does not exist" });
  }
  record.id = nextNumericId(studio.variants.slots);
  studio.variants.slots.push(record);
  await writeFileJson(FILES.variants, studio.variants);
  return record;
}

async function updateSlot(slotId, payload) {
  const studio = await readStudioData();
  const index = studio.variants.slots.findIndex((item) => Number(item.id) === Number(slotId));
  if (index === -1) throw createHttpError(404, "SLOT_NOT_FOUND", "Slot not found");
  const current = studio.variants.slots[index];
  const next = normalizeSlotRecord(payload, current);
  next.id = current.id;
  studio.variants.slots[index] = next;
  await writeFileJson(FILES.variants, studio.variants);
  return next;
}

async function deactivateSlot(slotId) {
  return updateSlot(slotId, { ...(await readStudioData()).variants.slots.find((item) => Number(item.id) === Number(slotId)), is_active: false });
}

async function createStone(payload) {
  const studio = await readStudioData();
  const record = normalizeStoneRecord(payload);
  record.id = nextNumericId(studio.stones.items);
  studio.stones.items.push(record);
  await writeFileJson(FILES.stones, studio.stones);
  return record;
}

async function updateStone(stoneId, payload) {
  const studio = await readStudioData();
  const index = studio.stones.items.findIndex((item) => Number(item.id) === Number(stoneId));
  if (index === -1) throw createHttpError(404, "STONE_NOT_FOUND", "Stone not found");
  const current = studio.stones.items[index];
  const next = normalizeStoneRecord(payload, current);
  next.id = current.id;
  studio.stones.items[index] = next;
  await writeFileJson(FILES.stones, studio.stones);
  return next;
}

async function deleteStone(stoneId) {
  const studio = await readStudioData();
  const stoneIndex = studio.stones.items.findIndex((item) => Number(item.id) === Number(stoneId));
  if (stoneIndex === -1) throw createHttpError(404, "STONE_NOT_FOUND", "Stone not found");

  const stone = studio.stones.items[stoneIndex];
  studio.stones.items.splice(stoneIndex, 1);
  studio.variants.variant_stones = normalizeVariantStoneDefaults(
    studio.variants.variant_stones.filter((item) => Number(item.stone_id) !== Number(stoneId))
  );

  await persistStudioParts(studio, ["stones", "variants"]);
  return { deleted: true, stone_id: Number(stoneId), stone_code: stone.code };
}

async function upsertVariantStone(payload) {
  const studio = await readStudioData();
  const record = normalizeVariantStoneRecord(payload);
  const index = studio.variants.variant_stones.findIndex((item) => Number(item.variant_id) === Number(record.variant_id) && Number(item.stone_id) === Number(record.stone_id));
  if (index === -1) {
    studio.variants.variant_stones.push(record);
  } else {
    studio.variants.variant_stones[index] = { ...studio.variants.variant_stones[index], ...record };
  }
  if (record.is_default) {
    studio.variants.variant_stones = studio.variants.variant_stones.map((item) => (
      Number(item.variant_id) === Number(record.variant_id) && Number(item.stone_id) !== Number(record.stone_id)
        ? { ...item, is_default: false }
        : item
    ));
  }
  await writeFileJson(FILES.variants, studio.variants);
  return record;
}

async function deleteVariantStone(variantId, stoneId) {
  const studio = await readStudioData();
  const nextEntries = studio.variants.variant_stones.filter((item) => !(
    Number(item.variant_id) === Number(variantId) && Number(item.stone_id) === Number(stoneId)
  ));
  const targetVariantEntries = syncDefaultFlags(
    nextEntries
      .filter((item) => Number(item.variant_id) === Number(variantId))
      .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
  );
  const unaffectedEntries = nextEntries.filter((item) => Number(item.variant_id) !== Number(variantId));
  studio.variants.variant_stones = [...unaffectedEntries, ...targetVariantEntries];
  await writeFileJson(FILES.variants, studio.variants);
  return { deleted: true, variant_id: Number(variantId), stone_id: Number(stoneId) };
}

async function listAssets() {
  const studio = await readStudioData();
  return sortByOrder(studio.assets.items);
}

async function createAssetRecord(payload) {
  const studio = await readStudioData();
  const kind = requireText(payload, "kind", "Asset kind");
  if (!ALLOWED_ASSET_KINDS.has(kind)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Unsupported asset kind", {
      kind: "Unsupported asset kind"
    });
  }
  const assetPath = requireText(payload, "path", "Asset path");
  if (!assetPath.startsWith("/assets/")) {
    throw createHttpError(422, "VALIDATION_ERROR", "Asset path must be public /assets path", {
      path: "Asset path must start with /assets/"
    });
  }
  const next = {
    id: nextNumericId(studio.assets.items),
    kind,
    path: assetPath,
    width: toNumber(payload.width, 0),
    height: toNumber(payload.height, 0),
    label: normalizeText(payload.label, path.basename(payload.path)),
    tags: Array.isArray(payload.tags) ? payload.tags.map((item) => normalizeText(item)).filter(Boolean) : [],
    created_at: new Date().toISOString()
  };
  studio.assets.items.push(next);
  await writeFileJson(FILES.assets, studio.assets);
  return next;
}

async function uploadAsset(payload) {
  const fileName = normalizeText(payload.file_name, "asset.png");
  const kind = normalizeText(payload.kind, "other");
  if (!ALLOWED_ASSET_KINDS.has(kind)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Unsupported asset kind", {
      kind: "Unsupported asset kind"
    });
  }
  const dataUrl = normalizeText(payload.data_url);
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw createHttpError(422, "INVALID_IMAGE", "Only PNG, JPG or WEBP images are supported");
  }

  const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  const safeBase = fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "asset";
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw createHttpError(422, "INVALID_IMAGE", "Image is too large", {
      data_url: "Image must be smaller than 8 MB"
    });
  }
  const targetDir = path.resolve(process.cwd(), "public", "assets", "uploads", kind);
  await fs.mkdir(targetDir, { recursive: true });
  const storedName = `${safeBase}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  const absolutePath = path.join(targetDir, storedName);
  await fs.writeFile(absolutePath, bytes);
  const meta = await resolveImageMetadata(absolutePath);
  return createAssetRecord({
    kind,
    path: `/assets/uploads/${kind}/${storedName}`,
    width: meta.width,
    height: meta.height,
    label: payload.label || safeBase,
    tags: payload.tags || []
  });
}

async function deleteAsset(assetId) {
  const studio = await readStudioData();
  const assetIndex = studio.assets.items.findIndex((item) => Number(item.id) === Number(assetId));
  if (assetIndex === -1) throw createHttpError(404, "ASSET_NOT_FOUND", "Asset not found");

  const asset = studio.assets.items[assetIndex];
  studio.assets.items.splice(assetIndex, 1);
  studio.variants.items = studio.variants.items.map((item) => (
    Number(item.base_asset_id) === Number(assetId) ? { ...item, base_asset_id: null } : item
  ));
  studio.stones.items = studio.stones.items.map((item) => (
    Number(item.asset_id) === Number(assetId) ? { ...item, asset_id: null } : item
  ));
  studio.productMeta.items = studio.productMeta.items.map((item) => (
    Number(item.asset_id) === Number(assetId) ? { ...item, asset_id: null } : item
  ));

  const uploadsRoot = path.resolve(process.cwd(), "public", "assets", "uploads");
  if (typeof asset.path === "string" && asset.path.startsWith("/assets/uploads/")) {
    const absoluteAssetPath = path.resolve(process.cwd(), "public", asset.path.replace(/^\/assets\//, "assets/"));
    if (absoluteAssetPath.startsWith(uploadsRoot)) {
      await fs.unlink(absoluteAssetPath).catch(() => {});
    }
  }

  await persistStudioParts(studio, ["assets", "variants", "stones", "productMeta"]);
  return { deleted: true, asset_id: Number(assetId), path: asset.path || null };
}

async function listProductMeta() {
  const studio = await readStudioData();
  return studio.productMeta.items;
}

async function upsertProductMeta(payload) {
  const studio = await readStudioData();
  const record = {
    product_id: toNumber(payload.product_id, 0),
    variant_id: payload.variant_id == null || payload.variant_id === "" ? null : toNumber(payload.variant_id, 0),
    asset_id: payload.asset_id == null || payload.asset_id === "" ? null : toNumber(payload.asset_id, 0)
  };
  const index = studio.productMeta.items.findIndex((item) => Number(item.product_id) === Number(record.product_id));
  if (index === -1) {
    studio.productMeta.items.push(record);
  } else {
    studio.productMeta.items[index] = record;
  }
  await writeFileJson(FILES.productMeta, studio.productMeta);
  return record;
}

module.exports = {
  calculateStudioPrice,
  createAssetRecord,
  deleteAsset,
  createSlot,
  createStone,
  createType,
  createVariant,
  deleteStone,
  deleteType,
  deleteVariant,
  deactivateSlot,
  deleteVariantStone,
  getPublicConstructorConfig,
  listAdminConstructorConfig,
  listAssets,
  listProductMeta,
  upsertProductMeta,
  upsertVariantStone,
  updateSlot,
  updateStone,
  updateType,
  updateVariant,
  uploadAsset
};
