// Файл рахує ціну виробу з конструктора та формує preview-шари для відповіді API.
const { BUSINESS_RULES } = require("../../constants/business-rules");
const { createHttpError } = require("../../utils/http-error");
const { resolveLocale } = require("../../utils/locale");
const { resolveCustomDesignChainConfiguration } = require("../../utils/pendant-chain");
const {
  normalizeText,
  readStudioData,
  sortByOrder
} = require("./constructor-json.store");
const { normalizeConstructorMaterialCode } = require("./constructor-normalizers");

// Знаходить активний тип і варіант прикраси для розрахунку.
function getVariantContext(studio, jewelryTypeId, variantId) {
  const type = studio.types.items.find((item) => Number(item.id) === Number(jewelryTypeId) && item.is_active !== false);
  if (!type) throw createHttpError(404, "JEWELRY_TYPE_NOT_FOUND", "Jewelry type not found");
  const variant = studio.variants.items.find((item) => Number(item.id) === Number(variantId) && Number(item.type_id) === Number(type.id) && item.is_active !== false);
  if (!variant) throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");
  return { type, variant };
}

// Будує список візуальних шарів preview для бази, каменів і гравіювання.
function buildPreviewLayersFromVariant(studio, variant, stoneSelections, engravingText) {
  const assetsById = Object.fromEntries(studio.assets.items.map((asset) => [asset.id, asset]));
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

// Рахує фінальну ціну, перевіряє конфігурацію і повертає нормалізовані дані.
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

module.exports = {
  buildPreviewLayersFromVariant,
  calculateStudioPrice,
  getVariantContext
};
