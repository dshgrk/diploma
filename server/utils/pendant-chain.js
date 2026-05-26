const { createHttpError } = require("./http-error");

const READY_CHAIN_PRICES_UAH = {
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

const CONSTRUCTOR_CHAIN_PRICES_UAH = {
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

const VALID_CHAIN_METALS = new Set(Object.keys(READY_CHAIN_PRICES_UAH));

function normalizePendantType(productOrType) {
  const rawValue =
    typeof productOrType === "string"
      ? productOrType
      : productOrType?.filter_type || productOrType?.product_type || productOrType?.type || productOrType?.code || productOrType?.jewelry_type_code;
  return String(rawValue || "").trim().toLowerCase() === "pendant";
}

function normalizeChainOption(rawValue) {
  const normalized = String(rawValue || "none").trim().toLowerCase();
  if (!normalized || normalized === "none") return "none";
  if (normalized === "40cm" || normalized === "40-cm" || normalized === "40 cm") return "40cm";
  if (normalized === "45cm" || normalized === "45-cm" || normalized === "45 cm") return "45cm";
  if (normalized === "50cm" || normalized === "50-cm" || normalized === "50 cm") return "50cm";
  return null;
}

function extractRequestedChainOption(configuration = {}) {
  return configuration?.chainOption ?? configuration?.chain_option ?? configuration?.chain?.option ?? "none";
}

function normalizeCatalogChainMetal(rawMetal) {
  const normalized = String(rawMetal || "").trim();
  return VALID_CHAIN_METALS.has(normalized) ? normalized : null;
}

function normalizeConstructorChainMetal(materialCode) {
  const normalized = String(materialCode || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "silver" || normalized === "silver_925") return "Silver";
  if (normalized === "gold" || normalized === "gold_plated" || normalized === "solid_gold") return "Gold";
  if (normalized === "rose_gold" || normalized === "rose_gold_plated" || normalized === "rose_gold_925") return "Rose Gold";
  return null;
}

function buildPendantChainSelection(chainOption, chainMetal, priceMap = READY_CHAIN_PRICES_UAH) {
  const normalizedOption = normalizeChainOption(chainOption);
  if (!normalizedOption) {
    throw createHttpError(422, "INVALID_CONFIGURATION_VALUE", "Unsupported chain option", {
      chainOption: "Chain option must be one of: none, 40cm, 45cm, 50cm"
    });
  }

  if (normalizedOption === "none") {
    return {
      option: "none",
      length: null,
      metal: null,
      price: 0
    };
  }

  if (!chainMetal || !VALID_CHAIN_METALS.has(chainMetal)) {
    return {
      option: normalizedOption,
      length: CHAIN_OPTION_LENGTHS[normalizedOption],
      metal: null,
      price: 0
    };
  }

  return {
    option: normalizedOption,
    length: CHAIN_OPTION_LENGTHS[normalizedOption],
    metal: chainMetal,
    price: Number(priceMap?.[chainMetal]?.[normalizedOption] || 0)
  };
}

function resolveReadyProductChainConfiguration(product, configuration = {}) {
  if (!normalizePendantType(product)) return null;
  return buildPendantChainSelection(extractRequestedChainOption(configuration), normalizeCatalogChainMetal(product?.filter_metal), READY_CHAIN_PRICES_UAH);
}

function resolveCustomDesignChainConfiguration(jewelryType, configuration = {}) {
  if (!normalizePendantType(jewelryType)) return null;
  return buildPendantChainSelection(extractRequestedChainOption(configuration), normalizeConstructorChainMetal(configuration?.material), CONSTRUCTOR_CHAIN_PRICES_UAH);
}

function calculateReadyProductUnitPrice(product, configuration = {}) {
  const basePrice = Number(product?.price || 0);
  return basePrice + Number(configuration?.chain?.price || 0);
}

module.exports = {
  CHAIN_OPTION_LENGTHS,
  READY_CHAIN_PRICES_UAH,
  CONSTRUCTOR_CHAIN_PRICES_UAH,
  calculateReadyProductUnitPrice,
  extractRequestedChainOption,
  normalizeCatalogChainMetal,
  normalizeChainOption,
  normalizeConstructorChainMetal,
  normalizePendantType,
  resolveCustomDesignChainConfiguration,
  resolveReadyProductChainConfiguration
};
