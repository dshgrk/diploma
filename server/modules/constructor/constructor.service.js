const { getPublicConstructorConfig } = require("./constructor-json.service");
const { createHttpError } = require("../../utils/http-error");

async function getConstructorConfig(req) {
  return getPublicConstructorConfig(req);
}

async function listConstructorTypes(req) {
  const config = await getPublicConstructorConfig(req);
  return { types: config.types };
}

async function listConstructorVariants(req) {
  const config = await getPublicConstructorConfig(req);
  const typeId = req.query.type_id == null ? null : Number(req.query.type_id);
  const typeCode = String(req.query.type || "").trim();
  const type = typeId
    ? config.types.find((item) => Number(item.id) === typeId)
    : config.types.find((item) => item.code === typeCode);
  const variants = type
    ? config.variants.filter((variant) => Number(variant.type_id) === Number(type.id))
    : config.variants;

  return { variants };
}

async function getConstructorVariantOptions(req) {
  const config = await getPublicConstructorConfig(req);
  const variant = config.variants.find((item) => Number(item.id) === Number(req.params.variantId));
  if (!variant) {
    throw createHttpError(404, "VARIANT_NOT_FOUND", "Variant not found");
  }
  const type = config.types.find((item) => Number(item.id) === Number(variant.type_id)) || null;
  const slots = config.slotsByVariant[variant.id] || [];
  const matrix = config.variantStoneMatrix.filter((entry) => Number(entry.variant_id) === Number(variant.id) && entry.is_enabled !== false);
  const enabledStoneIds = new Set(matrix.map((entry) => Number(entry.stone_id)));
  const stones = config.stones.filter((stone) => enabledStoneIds.has(Number(stone.id)));

  return {
    type,
    variant,
    slots,
    stones,
    variantStoneMatrix: matrix
  };
}

module.exports = {
  getConstructorConfig,
  getConstructorVariantOptions,
  listConstructorTypes,
  listConstructorVariants
};
