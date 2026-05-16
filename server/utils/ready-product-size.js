const READY_PRODUCT_SIZE_DEFINITIONS = {
  ring: {
    label_uk: "Розмір каблучки",
    label_en: "Ring size",
    options: [
      { code: "16", label_uk: "16", label_en: "16" },
      { code: "17", label_uk: "17", label_en: "17" },
      { code: "18", label_uk: "18", label_en: "18" },
      { code: "19", label_uk: "19", label_en: "19" }
    ]
  },
  bracelet: {
    label_uk: "Довжина браслета",
    label_en: "Bracelet length",
    options: [
      { code: "16-cm", label_uk: "16 см", label_en: "16 cm", aliases: ["16 cm", "16 см"] },
      { code: "17-cm", label_uk: "17 см", label_en: "17 cm", aliases: ["17 cm", "17 см"] },
      { code: "18-cm", label_uk: "18 см", label_en: "18 cm", aliases: ["18 cm", "18 см"] },
      { code: "19-cm", label_uk: "19 см", label_en: "19 cm", aliases: ["19 cm", "19 см"] }
    ]
  },
  earrings: {
    label_uk: "Розмір",
    label_en: "Size",
    options: [
      { code: "universal", label_uk: "Універсальний", label_en: "Universal", aliases: ["universal", "універсальний"] }
    ]
  }
};

function normalizeReadyProductType(productType) {
  const normalized = String(productType || "").trim().toLowerCase();
  if (normalized === "ring") return "ring";
  if (normalized === "bracelet") return "bracelet";
  if (normalized === "earrings") return "earrings";
  return null;
}

function getReadyProductSizeDefinition(productType) {
  const normalizedType = normalizeReadyProductType(productType);
  return normalizedType ? READY_PRODUCT_SIZE_DEFINITIONS[normalizedType] || null : null;
}

function getReadyProductSizeOptions(productType) {
  return getReadyProductSizeDefinition(productType)?.options || [];
}

function findReadyProductSizeOption(productType, rawSize) {
  const normalizedRaw = String(rawSize || "").trim().toLowerCase();
  if (!normalizedRaw) return null;

  const definitions = productType
    ? [getReadyProductSizeDefinition(productType)].filter(Boolean)
    : Object.values(READY_PRODUCT_SIZE_DEFINITIONS);

  for (const definition of definitions) {
    for (const option of definition.options || []) {
      const aliases = [option.code, option.label_uk, option.label_en, ...(option.aliases || [])]
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean);
      if (aliases.includes(normalizedRaw)) {
        return option;
      }
    }
  }

  return null;
}

function getDefaultReadyProductSizeCode(product = {}) {
  const productType = product.filter_type || product.product_type || product.type;
  const definition = getReadyProductSizeDefinition(productType);
  if (!definition?.options?.length) return null;

  const preferredValue =
    normalizeReadyProductType(productType) === "ring"
      ? product.filter_ring_size
      : normalizeReadyProductType(productType) === "bracelet"
        ? product.filter_bracelet_length
        : null;

  const matched = findReadyProductSizeOption(productType, preferredValue);
  return matched?.code || definition.options[0].code;
}

function normalizeReadyProductConfiguration(product = {}, configuration = {}) {
  const productType = product.filter_type || product.product_type || product.type;
  const definition = getReadyProductSizeDefinition(productType);
  if (!definition?.options?.length) return {};

  const selected = findReadyProductSizeOption(productType, configuration?.size);
  return {
    size: selected?.code || getDefaultReadyProductSizeCode(product)
  };
}

function readyProductConfigurationsEqual(left = {}, right = {}) {
  return (
    String(left?.size || "").trim() === String(right?.size || "").trim() &&
    String(left?.chain?.option || "").trim() === String(right?.chain?.option || "").trim()
  );
}

module.exports = {
  findReadyProductSizeOption,
  getDefaultReadyProductSizeCode,
  getReadyProductSizeDefinition,
  getReadyProductSizeOptions,
  normalizeReadyProductConfiguration,
  normalizeReadyProductType,
  readyProductConfigurationsEqual
};
