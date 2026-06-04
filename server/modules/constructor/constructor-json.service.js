// Файл збирає публічний фасад JSON-конструктора з маленьких domain-сервісів.
const { resolveLocale } = require("../../utils/locale");
const { buildPublicConfig, readStudioData } = require("./constructor-json.store");
const {
  createSlot,
  createStone,
  createType,
  createVariant,
  deleteStone,
  deleteType,
  deleteVariant,
  deactivateSlot,
  deleteVariantStone,
  listAdminConstructorConfig,
  listProductMeta,
  upsertProductMeta,
  upsertVariantStone,
  updateSlot,
  updateStone,
  updateType,
  updateVariant
} = require("./constructor-admin-crud.service");
const {
  createAssetRecord,
  deleteAsset,
  listAssets,
  uploadAsset
} = require("./constructor-assets.service");
const { calculateStudioPrice } = require("./constructor-pricing.service");

// Отримує публічну конфігурацію конструктора з урахуванням локалі запиту.
async function getPublicConstructorConfig(req) {
  const studio = await readStudioData();
  return buildPublicConfig(studio, resolveLocale(req));
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
