// Файл містить логіку серверного модуля catalog.
const CATALOG_FILTER_KEYS = [
  "type",
  "metal",
  "stoneType",
  "stoneShape",
  "stoneColor",
  "stoneSize",
  "ringSize",
  "ringType",
  "braceletLength"
];

const FILTER_COLUMN_BY_KEY = {
  type: "filter_type",
  metal: "filter_metal",
  stoneType: "filter_stone_type",
  stoneShape: "filter_stone_shape",
  stoneColor: "filter_stone_color",
  stoneSize: "filter_stone_size",
  ringSize: "filter_ring_size",
  ringType: "filter_ring_type",
  braceletLength: "filter_bracelet_length"
};

const FILTER_QUERY_ALIASES = {
  type: ["type"],
  metal: ["metal"],
  stoneType: ["stoneType", "stone"],
  stoneShape: ["stoneShape"],
  stoneColor: ["stoneColor"],
  stoneSize: ["stoneSize"],
  ringSize: ["ringSize"],
  ringType: ["ringType", "ringStyle"],
  braceletLength: ["braceletLength"]
};

const CATALOG_FILTERS = {
  type: ["Ring", "Bracelet", "Pendant", "Earrings"],
  metal: ["Gold", "Silver", "Rose Gold", "Steel"],
  stoneType: [
    "Diamond",
    "Emerald",
    "Sapphire",
    "None",
    "Pearl",
    "Topaz",
    "Opal",
    "Garnet",
    "Citrine",
    "Morganite",
    "Zircon",
    "Quartz",
    "Rose Quartz",
    "Spinel",
    "Aquamarine",
    "Tourmaline",
    "Moonstone"
  ],
  stoneShape: ["Round", "Oval", "Princess", "Pear", "Marquise", "Cushion", "Baguette", "Heart", "Emerald Cut", "Trillion"],
  stoneColor: ["White", "Green", "Blue", "Cream", "Clear", "Honey", "Champagne", "Blush", "Burgundy", "Smoke", "Aqua", "Yellow", "Ice"],
  stoneSize: [
    "0.5 ct",
    "0.6 ct",
    "0.7 ct",
    "0.8 ct",
    "0.9 ct",
    "1 ct",
    "1.0 ct",
    "1.1 ct",
    "1.2 ct",
    "1.3 ct",
    "1.4 ct",
    "1.5 ct",
    "1.6 ct",
    "2 ct",
    "5 mm",
    "6 mm"
  ],
  ringSize: ["16", "17", "18", "19"],
  ringType: ["Classic", "Fashion", "Statement", "Minimal", "Evening", "Romantic", "Signature"],
  braceletLength: ["16 cm", "17 cm", "18 cm", "19 cm"]
};

const ALLOWED_TYPES = new Set(["Ring", "Bracelet", "Pendant", "Earrings"]);
const ALLOWED_SORTS = new Set(["default", "price_asc", "price_desc", "newest"]);

// Виконує локальну логіку collect query values для модуля серверного модуля catalog.
function collectQueryValues(query, aliases = []) {
  return aliases
    .flatMap((alias) => {
      const value = query?.[alias];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return value.split(",");
      return [];
    })
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

// Виконує локальну логіку unique values для модуля серверного модуля catalog.
function uniqueValues(values = []) {
  return [...new Set(values)];
}

// Нормалізує normalize catalog filters, щоб API та UI працювали з однаковим форматом даних.
function normalizeCatalogFilters(query = {}) {
  return CATALOG_FILTER_KEYS.reduce((filters, key) => {
    const values = uniqueValues(collectQueryValues(query, FILTER_QUERY_ALIASES[key]));
    if (!values.length) return filters;

    const normalizedValues =
      key === "type" ? values.filter((value) => ALLOWED_TYPES.has(value)) : values;

    if (normalizedValues.length) {
      filters[key] = normalizedValues;
    }

    return filters;
  }, {});
}

// Нормалізує normalize catalog price, щоб API та UI працювали з однаковим форматом даних.
function normalizeCatalogPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
}

// Нормалізує normalize catalog sort, щоб API та UI працювали з однаковим форматом даних.
function normalizeCatalogSort(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "default";
  if (normalized === "price-asc") return "price_asc";
  if (normalized === "price-desc") return "price_desc";
  if (normalized === "new" || normalized === "new_arrivals") return "newest";
  return ALLOWED_SORTS.has(normalized) ? normalized : "default";
}

// Нормалізує normalize catalog query, щоб API та UI працювали з однаковим форматом даних.
function normalizeCatalogQuery(query = {}) {
  return {
    filters: normalizeCatalogFilters(query),
    priceMin: normalizeCatalogPrice(query.priceMin),
    priceMax: normalizeCatalogPrice(query.priceMax),
    sort: normalizeCatalogSort(query.sort)
  };
}

// Виконує локальну логіку serialize product filters для модуля серверного модуля catalog.
function serializeProductFilters(record) {
  return {
    type: record.filter_type,
    metal: record.filter_metal,
    stoneType: record.filter_stone_type,
    stone: record.filter_stone_type,
    stoneShape: record.filter_stone_shape,
    stoneColor: record.filter_stone_color,
    stoneSize: record.filter_stone_size,
    ringSize: record.filter_ring_size,
    ringType: record.filter_ring_type,
    ringStyle: record.filter_ring_type,
    braceletLength: record.filter_bracelet_length
  };
}

module.exports = {
  CATALOG_FILTERS,
  FILTER_COLUMN_BY_KEY,
  normalizeCatalogFilters,
  normalizeCatalogPrice,
  normalizeCatalogQuery,
  normalizeCatalogSort,
  serializeProductFilters
};
