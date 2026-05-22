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

const ALLOWED_TYPES = new Set(["Ring", "Bracelet", "Pendant", "Earrings"]);
const ALLOWED_SORTS = new Set(["default", "price_asc", "price_desc", "newest"]);

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

function uniqueValues(values = []) {
  return [...new Set(values)];
}

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

function normalizeCatalogPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
}

function normalizeCatalogSort(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "default";
  if (normalized === "price-asc") return "price_asc";
  if (normalized === "price-desc") return "price_desc";
  if (normalized === "new" || normalized === "new_arrivals") return "newest";
  return ALLOWED_SORTS.has(normalized) ? normalized : "default";
}

function normalizeCatalogQuery(query = {}) {
  return {
    filters: normalizeCatalogFilters(query),
    priceMin: normalizeCatalogPrice(query.priceMin),
    priceMax: normalizeCatalogPrice(query.priceMax),
    sort: normalizeCatalogSort(query.sort)
  };
}

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
  FILTER_COLUMN_BY_KEY,
  normalizeCatalogFilters,
  normalizeCatalogPrice,
  normalizeCatalogQuery,
  normalizeCatalogSort,
  serializeProductFilters
};
