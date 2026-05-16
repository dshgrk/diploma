const READY_PRODUCT_SIZE_DEFINITIONS = {
  Ring: {
    label: { uk: "Розмір каблучки", en: "Ring size" },
    options: [
      { code: "16", label: { uk: "16", en: "16" } },
      { code: "17", label: { uk: "17", en: "17" } },
      { code: "18", label: { uk: "18", en: "18" } },
      { code: "19", label: { uk: "19", en: "19" } }
    ],
    resolveDefault(filters = {}) {
      return findReadyProductSizeOption("Ring", filters.ringSize)?.code || "17";
    }
  },
  Bracelet: {
    label: { uk: "Довжина браслета", en: "Bracelet length" },
    options: [
      { code: "16-cm", label: { uk: "16 см", en: "16 cm" }, aliases: ["16 cm", "16 см"] },
      { code: "17-cm", label: { uk: "17 см", en: "17 cm" }, aliases: ["17 cm", "17 см"] },
      { code: "18-cm", label: { uk: "18 см", en: "18 cm" }, aliases: ["18 cm", "18 см"] },
      { code: "19-cm", label: { uk: "19 см", en: "19 cm" }, aliases: ["19 cm", "19 см"] }
    ],
    resolveDefault(filters = {}) {
      return findReadyProductSizeOption("Bracelet", filters.braceletLength)?.code || "18-cm";
    }
  },
  Earrings: {
    label: { uk: "Розмір", en: "Size" },
    options: [{ code: "universal", label: { uk: "Універсальний", en: "Universal" }, aliases: ["universal", "універсальний"] }],
    resolveDefault() {
      return "universal";
    }
  }
};

function normalizeReadyProductLocale(locale = "uk") {
  if (locale === "uk-UA") return "uk";
  if (locale === "en-US") return "en";
  return locale === "en" ? "en" : "uk";
}

function resolveReadyProductType(productOrType) {
  if (!productOrType) return null;
  if (typeof productOrType === "string") return READY_PRODUCT_SIZE_DEFINITIONS[productOrType] ? productOrType : null;
  return productOrType?.filters?.type || productOrType?.product_type || productOrType?.type || null;
}

export function getReadyProductSizeDefinition(productOrType) {
  const type = resolveReadyProductType(productOrType);
  return type ? READY_PRODUCT_SIZE_DEFINITIONS[type] || null : null;
}

export function findReadyProductSizeOption(productOrType, rawSize) {
  const normalizedRaw = String(rawSize || "").trim().toLowerCase();
  if (!normalizedRaw) return null;

  const definition = getReadyProductSizeDefinition(productOrType);
  const searchSpace = definition ? [definition] : Object.values(READY_PRODUCT_SIZE_DEFINITIONS);

  for (const item of searchSpace) {
    for (const option of item.options || []) {
      const aliases = [option.code, option.label.uk, option.label.en, ...(option.aliases || [])]
        .map((value) => String(value || "").trim().toLowerCase())
        .filter(Boolean);
      if (aliases.includes(normalizedRaw)) {
        return option;
      }
    }
  }

  return null;
}

export function getReadyProductSizeOptions(productOrType, locale = "uk") {
  const normalizedLocale = normalizeReadyProductLocale(locale);
  const definition = getReadyProductSizeDefinition(productOrType);
  if (!definition) return [];
  return definition.options.map((option) => ({
    code: option.code,
    label: option.label[normalizedLocale] || option.label.en
  }));
}

export function getReadyProductDefaultSize(product, locale = "uk") {
  const definition = getReadyProductSizeDefinition(product);
  if (!definition) return "";
  const fallbackCode = definition.resolveDefault(product?.filters || {});
  const selected = findReadyProductSizeOption(product, fallbackCode);
  return selected?.code || fallbackCode || "";
}

export function getReadyProductSizeTitle(productOrType, locale = "uk") {
  const normalizedLocale = normalizeReadyProductLocale(locale);
  const definition = getReadyProductSizeDefinition(productOrType);
  return definition?.label?.[normalizedLocale] || definition?.label?.en || (normalizedLocale === "uk" ? "Розмір" : "Size");
}

export function getReadyProductSizeLabel(productOrType, sizeCode, locale = "uk") {
  const normalizedLocale = normalizeReadyProductLocale(locale);
  const matched = findReadyProductSizeOption(productOrType, sizeCode);
  if (matched) return matched.label[normalizedLocale] || matched.label.en;
  return String(sizeCode || "").trim();
}

export function getReadyProductNormalizedSize(productOrType, sizeCode, locale = "uk") {
  const matched = findReadyProductSizeOption(productOrType, sizeCode);
  if (matched) return matched.code;
  if (typeof productOrType === "object") return getReadyProductDefaultSize(productOrType, locale);
  const options = getReadyProductSizeOptions(productOrType, locale);
  return options[0]?.code || "";
}

export function readyProductConfigurationsEqual(left = {}, right = {}) {
  return (
    String(left?.size || "").trim() === String(right?.size || "").trim() &&
    String(left?.chain?.option || "").trim() === String(right?.chain?.option || "").trim()
  );
}
