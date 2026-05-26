export const READY_CHAIN_PRICES_UAH = {
  Silver: {
    none: 0,
    "40cm": 1300,
    "45cm": 1450,
    "50cm": 1600
  },
  Gold: {
    none: 0,
    "40cm": 1700,
    "45cm": 1900,
    "50cm": 2100
  },
  "Rose Gold": {
    none: 0,
    "40cm": 1750,
    "45cm": 1950,
    "50cm": 2150
  }
};

export const CONSTRUCTOR_CHAIN_PRICES_UAH = {
  Silver: {
    none: 0,
    "40cm": 1800,
    "45cm": 2100,
    "50cm": 2400
  },
  Gold: {
    none: 0,
    "40cm": 3400,
    "45cm": 3900,
    "50cm": 4400
  },
  "Rose Gold": {
    none: 0,
    "40cm": 2900,
    "45cm": 3300,
    "50cm": 3700
  }
};

const CHAIN_OPTION_LENGTHS = {
  none: null,
  "40cm": 40,
  "45cm": 45,
  "50cm": 50
};

export function normalizePendantType(productOrType) {
  const rawValue =
    typeof productOrType === "string"
      ? productOrType
      : productOrType?.filters?.type || productOrType?.filter_type || productOrType?.product_type || productOrType?.type || productOrType?.code || productOrType?.jewelry_type_code;
  return String(rawValue || "").trim().toLowerCase() === "pendant";
}

export function normalizePendantChainOption(rawValue) {
  const normalized = String(rawValue || "none").trim().toLowerCase();
  if (!normalized || normalized === "none") return "none";
  if (normalized === "40cm" || normalized === "40-cm" || normalized === "40 cm") return "40cm";
  if (normalized === "45cm" || normalized === "45-cm" || normalized === "45 cm") return "45cm";
  if (normalized === "50cm" || normalized === "50-cm" || normalized === "50 cm") return "50cm";
  return null;
}

export function extractPendantChainOption(configuration = {}) {
  return configuration?.chainOption ?? configuration?.chain_option ?? configuration?.chain?.option ?? "none";
}

export function getPendantChainOptions(locale = "uk") {
  const isUk = locale === "uk" || locale === "uk-UA";
  return [
    { code: "none", label: isUk ? "Без ланцюжка" : "Without chain" },
    { code: "40cm", label: isUk ? "Додати ланцюжок 40 см" : "Add chain 40 cm" },
    { code: "45cm", label: isUk ? "Додати ланцюжок 45 см" : "Add chain 45 cm" },
    { code: "50cm", label: isUk ? "Додати ланцюжок 50 см" : "Add chain 50 cm" }
  ];
}

export function getPendantChainOptionLabel(option, locale = "uk") {
  const normalized = normalizePendantChainOption(option) || "none";
  return getPendantChainOptions(locale).find((item) => item.code === normalized)?.label || normalized;
}

export function normalizeCatalogChainMetal(rawMetal) {
  const normalized = String(rawMetal || "").trim();
  return Object.prototype.hasOwnProperty.call(READY_CHAIN_PRICES_UAH, normalized) ? normalized : null;
}

export function normalizeConstructorChainMetal(materialCode) {
  const normalized = String(materialCode || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "silver" || normalized === "silver_925") return "Silver";
  if (normalized === "gold" || normalized === "gold_plated" || normalized === "solid_gold") return "Gold";
  if (normalized === "rose_gold" || normalized === "rose_gold_plated" || normalized === "rose_gold_925") return "Rose Gold";
  return null;
}

export function buildPendantChainSelection(chainOption, chainMetal, priceMap = READY_CHAIN_PRICES_UAH) {
  const normalizedOption = normalizePendantChainOption(chainOption) || "none";
  if (normalizedOption === "none") {
    return {
      option: "none",
      length: null,
      metal: null,
      price: 0
    };
  }

  return {
    option: normalizedOption,
    length: CHAIN_OPTION_LENGTHS[normalizedOption],
    metal: chainMetal || null,
    price: chainMetal ? Number(priceMap?.[chainMetal]?.[normalizedOption] || 0) : 0
  };
}

export function resolveReadyProductPendantChain(product, chainOption) {
  if (!normalizePendantType(product)) return null;
  return buildPendantChainSelection(chainOption, normalizeCatalogChainMetal(product?.filters?.metal || product?.filter_metal), READY_CHAIN_PRICES_UAH);
}

export function resolveCustomDesignPendantChain(typeOrCode, configuration = {}) {
  if (!normalizePendantType(typeOrCode)) return null;
  return buildPendantChainSelection(extractPendantChainOption(configuration), normalizeConstructorChainMetal(configuration?.material), CONSTRUCTOR_CHAIN_PRICES_UAH);
}

export function getPendantChainSummary(chain, locale = "uk") {
  const isUk = locale === "uk" || locale === "uk-UA";
  const option = normalizePendantChainOption(chain?.option) || "none";
  if (option === "none") {
    return {
      inline: isUk ? "без ланцюжка" : "without chain",
      full: isUk ? "Комплектація: без ланцюжка" : "Configuration: without chain"
    };
  }

  const length = chain?.length || CHAIN_OPTION_LENGTHS[option];
  return {
    inline: isUk ? `ланцюжок ${length} см` : `chain ${length} cm`,
    full: isUk ? `Комплектація: ланцюжок ${length} см, у колір підвіски` : `Configuration: chain ${length} cm, matching pendant color`
  };
}

export function getPendantChainColorNote(metal, locale = "uk") {
  const isUk = locale === "uk" || locale === "uk-UA";
  return isUk ? `Колір ланцюжка: ${metal || "-"}` : `Chain color: ${metal || "-"}`;
}

export function getPendantChainUpsellNote(locale = "uk") {
  const isUk = locale === "uk" || locale === "uk-UA";
  return isUk
    ? "Базова ціна вказана за підвіску без ланцюжка. За бажанням можна додати ланцюжок у колір підвіски."
    : "The base price is shown for the pendant without a chain. You can add a chain matching the pendant color.";
}
